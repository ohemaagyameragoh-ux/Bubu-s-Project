import { prisma } from "./db";
import { requireTenantContext } from "./tenant-context";

// Models whose every row is owned by a tenant and must be auto-scoped by tenantId.
// Tenant and User are deliberately excluded: auth and workspace management need unscoped
// access (for example, looking a user up by email at login, before any tenant is known)
// and handle tenant filtering explicitly and carefully where needed.
const TENANT_OWNED = new Set<string>([
  "Commodity",
  "CommodityGrade",
  "QualityParameter",
  "Counterparty",
  "Transaction",
  "Lead",
  "Quote",
  "QuoteLine",
  "Order",
  "InventoryLot",
  "FarmerPurchase",
  "Trip",
  "TripLot",
  "HaulageRequest",
  "HaulingQuote",
  "Invoice",
  "InvoiceLine",
  "Payment",
  "LedgerEntry",
  "BankStatement",
  "StatementLine",
  "IntegrationCredential",
  "AuditLog",
  // Deliberately NOT scoped (visible or owned across tenants by design):
  // MarketplaceListing, MarketplaceOffer, MarketplaceDeal, TraderRating, Dispute,
  // PricePoint (global feed plus own), PlatformLedgerEntry (operator only).
]);

// Operations that carry a `where` we can constrain with tenantId. Prisma 5 allows extra,
// non-unique fields in `where` for findUnique, update, and delete (extendedWhereUnique is
// generally available), so adding tenantId is safe across all of these.
const WHERE_OPS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "findMany",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
  "update",
  "delete",
]);

function scopedClient(tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        // One hook covers every model and operation. For tenant-owned models we force the
        // tenantId on writes and constrain it on reads, deletes, and updates.
        async $allOperations({ model, operation, args, query }) {
          if (!model || !TENANT_OWNED.has(model)) {
            return query(args);
          }

          const a = (args ?? {}) as Record<string, unknown>;

          if (operation === "create") {
            a.data = { ...(a.data as object), tenantId };
          } else if (operation === "createMany") {
            const data = a.data as unknown;
            const rows = Array.isArray(data) ? data : [data];
            a.data = rows.map((r) => ({ ...(r as object), tenantId }));
          } else if (operation === "upsert") {
            a.where = { ...(a.where as object), tenantId };
            a.create = { ...(a.create as object), tenantId };
          } else if (WHERE_OPS.has(operation)) {
            a.where = { ...((a.where as object) ?? {}), tenantId };
          }

          return query(a);
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof scopedClient>;

// The tenant-scoped Prisma client for the current request. Throws if no tenant context is
// set, which is the desired failure: tenant-owned data must never be read unscoped.
export function tenantDb(): TenantDb {
  const { tenantId } = requireTenantContext();
  return scopedClient(tenantId);
}
