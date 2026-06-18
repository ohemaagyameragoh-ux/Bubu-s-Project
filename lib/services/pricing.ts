import { TradeMode } from "@prisma/client";
import { tenantDb } from "../tenant-db";
import { withTenantSession } from "../session";
import { requireTenantContext } from "../tenant-context";
import { recordAudit } from "../audit";
import { anthropicJSON, AI_MODELS } from "../ai";

export type PricePointView = { date: string; price: number };
export type ForecastPoint = { date: string; low: number; mid: number; high: number };

export async function listPricedCommodities() {
  return withTenantSession(async () => {
    const commodities = await tenantDb().commodity.findMany({ orderBy: { name: "asc" } });
    return commodities.map((c) => c.name);
  });
}

// History combines the tenant's own price entries, an optional global feed (tenantId null), and
// the tenant's own owner trade sell prices, so a new workspace still sees a trend from its trades.
async function buildHistory(commodityName: string): Promise<PricePointView[]> {
  const { tenantId } = requireTenantContext();
  const db = tenantDb();

  const points = await db.pricePoint.findMany({
    where: { commodityName, OR: [{ tenantId }, { tenantId: null }] },
    orderBy: { date: "asc" },
  });
  const trades = await db.transaction.findMany({
    where: { commodityName, mode: TradeMode.OWNER, sellPrice: { not: null } },
    orderBy: { tradeDate: "asc" },
  });

  const merged: { d: Date; price: number }[] = [
    ...points.map((p) => ({ d: p.date, price: p.price })),
    ...trades.map((t) => ({ d: t.tradeDate, price: t.sellPrice as number })),
  ].sort((a, b) => a.d.getTime() - b.d.getTime());

  return merged.map((m) => ({ date: m.d.toISOString().slice(0, 10), price: Math.round(m.price) }));
}

function linregForecast(history: PricePointView[]): {
  forecast: ForecastPoint[];
  changePct: number;
  confidence: "Low" | "Medium" | "High";
} {
  const ys = history.map((h) => h.price);
  const n = ys.length;
  if (n < 2) {
    const last = ys[n - 1] ?? 0;
    return { forecast: [], changePct: 0, confidence: "Low" };
  }
  const xs = ys.map((_, i) => i);
  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i += 1) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = my - slope * mx;
  const residuals = ys.map((y, i) => y - (intercept + slope * i));
  const sd = Math.sqrt(mean(residuals.map((r) => r * r)));
  const cv = my === 0 ? 1 : sd / my;

  const lastDate = new Date(history[n - 1].date);
  const forecast: ForecastPoint[] = [];
  for (let k = 1; k <= 2; k += 1) {
    const mid = Math.max(0, intercept + slope * (n - 1 + k));
    const band = Math.max(sd * 1.5, mid * 0.04);
    const d = new Date(lastDate);
    d.setMonth(d.getMonth() + k);
    forecast.push({
      date: d.toISOString().slice(0, 10),
      low: Math.round(Math.max(0, mid - band)),
      mid: Math.round(mid),
      high: Math.round(mid + band),
    });
  }

  const lastHistory = ys[n - 1];
  const lastMid = forecast[forecast.length - 1]?.mid ?? lastHistory;
  const changePct = lastHistory === 0 ? 0 : ((lastMid - lastHistory) / lastHistory) * 100;
  const confidence = n >= 8 && cv < 0.15 ? "High" : n >= 4 ? "Medium" : "Low";

  return { forecast, changePct, confidence };
}

export async function priceIntelligence(commodityName: string) {
  return withTenantSession(async () => {
    const history = await buildHistory(commodityName);
    const { forecast, changePct, confidence } = linregForecast(history);
    const latest = history[history.length - 1]?.price ?? 0;

    // Optional AI narrative. Falls back to a templated, disclaimered insight when no key is set.
    const ai = await anthropicJSON<{ insight: string }>(
      AI_MODELS.forecast,
      "You are a cautious commodity price analyst. Always include a disclaimer that this is not a guarantee.",
      `Commodity: ${commodityName}. Recent prices (GHS): ${history.slice(-8).map((h) => h.price).join(", ")}. Projected change: ${changePct.toFixed(1)} percent. Write two short sentences of insight. No em dashes.`,
      300,
    );
    const insight =
      ai?.insight ??
      `Prices for ${commodityName} have ${changePct >= 0 ? "trended upward" : "softened"} recently. The model projects roughly ${Math.abs(changePct).toFixed(1)} percent ${changePct >= 0 ? "upside" : "downside"} over the coming months. This is an estimate, not a guarantee.`;

    return { history, forecast, latest, changePct, confidence, insight };
  });
}

export async function addPricePoint(commodityName: string, region: string, date: Date, price: number) {
  return withTenantSession(async () => {
    const { tenantId } = requireTenantContext();
    const created = await tenantDb().pricePoint.create({
      data: { tenantId, commodityName: commodityName.trim(), region: region.trim(), date, price, source: "admin" },
    });
    await recordAudit({ action: "price.add", entity: "PricePoint", entityId: created.id });
    return created;
  });
}
