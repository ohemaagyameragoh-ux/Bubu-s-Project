import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { ownerPnlReport, brokerCommissionReport } from "@/lib/services/reports";
import { formatDate } from "@/lib/format";

// Escape a CSV cell: wrap in quotes and double any inner quotes.
function cell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map((r) => r.map(cell).join(",")).join("\n");
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user?.tenantId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const type = new URL(request.url).searchParams.get("type") === "broker" ? "broker" : "owner";

  let csv: string;
  if (type === "owner") {
    const report = await ownerPnlReport();
    const header = ["Reference", "Date", "Commodity", "Counterparty", "Quantity", "Unit", "Revenue", "Cost", "Profit"];
    const body = report.rows.map((r) => [
      r.reference,
      formatDate(r.tradeDate),
      r.commodityName,
      r.counterparty,
      r.quantity,
      r.unit,
      r.revenue,
      r.cost,
      r.profit,
    ]);
    csv = toCsv([header, ...body]);
  } else {
    const report = await brokerCommissionReport();
    const header = ["Reference", "Date", "Commodity", "Counterparty", "Quantity", "Unit", "Commission"];
    const body = report.rows.map((r) => [
      r.reference,
      formatDate(r.tradeDate),
      r.commodityName,
      r.counterparty,
      r.quantity,
      r.unit,
      r.commission,
    ]);
    csv = toCsv([header, ...body]);
  }

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${type}-report.csv"`,
    },
  });
}
