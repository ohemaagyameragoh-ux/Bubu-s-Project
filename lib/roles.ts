import { Role } from "@prisma/client";

// Human-readable role labels for the UI. Order matches how they appear in menus.
export const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  { value: Role.ADMIN, label: "Admin", description: "Sets up the workspace, staff, and connected accounts." },
  { value: Role.SALES, label: "Sales", description: "Handles requests, builds quotes, talks to clients." },
  { value: Role.PROCUREMENT, label: "Procurement and field agent", description: "Buys produce from farmers." },
  { value: Role.LOGISTICS, label: "Logistics", description: "Handles loading, delivery, and reports." },
  { value: Role.FINANCE, label: "Finance", description: "Handles invoices, payments, ledger, statements." },
];

export function roleLabel(role: Role | null): string {
  if (!role) return "";
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
}
