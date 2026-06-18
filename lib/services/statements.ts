import { PaymentDirection } from "@prisma/client";
import { tenantDb } from "../tenant-db";
import { withTenantSession } from "../session";
import { requireTenantContext } from "../tenant-context";
import { recordAudit } from "../audit";
import { anthropicJSON, AI_MODELS } from "../ai";

const CATEGORIES = [
  "Client receipt",
  "Farmer payment",
  "Freight and transport",
  "Fees and charges",
  "Fuel",
  "Airtime and data",
  "Salaries",
  "Other",
];

type ParsedLine = { date: Date | null; description: string; amount: number; direction: PaymentDirection };

// Lenient CSV parser. Accepts date, description, amount (a signed number, negative is money out)
// or date, description, debit, credit. Blank and header rows are skipped.
function parseCsv(text: string): ParsedLine[] {
  const rows = text.split(/\r?\n/).map((r) => r.trim()).filter(Boolean);
  const out: ParsedLine[] = [];
  for (const row of rows) {
    const cols = row.split(",").map((c) => c.trim());
    if (cols.length < 2) continue;
    // Skip an obvious header row.
    if (/date/i.test(cols[0]) && /desc/i.test(cols[1])) continue;

    const date = cols[0] && !Number.isNaN(Date.parse(cols[0])) ? new Date(cols[0]) : null;

    let amount = 0;
    let direction: PaymentDirection = PaymentDirection.OUT;
    let description = "";

    if (cols.length >= 4) {
      // date, description, debit, credit
      description = cols.slice(1, cols.length - 2).join(", ");
      const debit = Number(cols[cols.length - 2].replace(/[^0-9.-]/g, ""));
      const credit = Number(cols[cols.length - 1].replace(/[^0-9.-]/g, ""));
      if (credit > 0) {
        amount = credit;
        direction = PaymentDirection.IN;
      } else {
        amount = Math.abs(debit);
        direction = PaymentDirection.OUT;
      }
    } else {
      description = cols.slice(1, cols.length - 1).join(", ");
      const raw = Number(cols[cols.length - 1].replace(/[^0-9.-]/g, ""));
      amount = Math.abs(raw);
      direction = raw < 0 ? PaymentDirection.OUT : PaymentDirection.IN;
    }

    if (!Number.isFinite(amount) || amount === 0) continue;
    out.push({ date, description: description || "(no description)", amount, direction });
  }
  return out;
}

function heuristicCategory(desc: string, direction: PaymentDirection): string {
  const d = desc.toLowerCase();
  if (/(freight|haul|transport|truck|cartage)/.test(d)) return "Freight and transport";
  if (/(farmer|aggregat|produce|grain|maize|soya|cashew)/.test(d) && direction === PaymentDirection.OUT) return "Farmer payment";
  if (/(fuel|diesel|petrol)/.test(d)) return "Fuel";
  if (/(airtime|data|mtn|vodafone|telecom)/.test(d)) return "Airtime and data";
  if (/(salary|wage|payroll)/.test(d)) return "Salaries";
  if (/(fee|charge|levy|commission|sms)/.test(d)) return "Fees and charges";
  if (direction === PaymentDirection.IN) return "Client receipt";
  return "Other";
}

async function classify(lines: ParsedLine[]): Promise<string[]> {
  const ai = await anthropicJSON<string[]>(
    AI_MODELS.classify,
    `You categorize bank and mobile money statement lines for a commodity trader. Use only these categories: ${CATEGORIES.join(", ")}.`,
    `Return a JSON array of category strings, one per line, in the same order. Lines:\n${lines
      .map((l, i) => `${i + 1}. ${l.direction} ${l.amount} ${l.description}`)
      .join("\n")}`,
    1500,
  );
  if (Array.isArray(ai) && ai.length === lines.length) {
    return ai.map((c, i) => (CATEGORIES.includes(c) ? c : heuristicCategory(lines[i].description, lines[i].direction)));
  }
  return lines.map((l) => heuristicCategory(l.description, l.direction));
}

export async function listStatements() {
  return withTenantSession(() =>
    tenantDb().bankStatement.findMany({ orderBy: { uploadedAt: "desc" }, include: { lines: true } }),
  );
}

export async function uploadStatement(fileName: string, account: string, csvText: string) {
  return withTenantSession(async () => {
    const { tenantId } = requireTenantContext();
    const parsed = parseCsv(csvText);
    if (parsed.length === 0) throw new Error("No statement lines found. Check the file format.");

    const categories = await classify(parsed);
    const payments = await tenantDb().payment.findMany();

    const statement = await tenantDb().bankStatement.create({
      data: { tenantId, fileName: fileName || "statement.csv", account: account || "" },
    });

    for (let i = 0; i < parsed.length; i += 1) {
      const line = parsed[i];
      // Reconcile: a line is matched if a recorded payment has the same direction and amount.
      const matched = payments.some(
        (p) => p.direction === line.direction && Math.abs(p.amount - line.amount) < 1,
      );
      await tenantDb().statementLine.create({
        data: {
          tenantId,
          statementId: statement.id,
          date: line.date,
          description: line.description,
          amount: line.amount,
          direction: line.direction,
          category: categories[i],
          matched,
          // Unmatched lines are where leakage hides: money out we did not expect, or a client
          // receipt the system never recorded.
          flagged: !matched,
        },
      });
    }

    await recordAudit({ action: "statement.upload", entity: "BankStatement", entityId: statement.id, metadata: { lines: parsed.length } });
    return statement;
  });
}
