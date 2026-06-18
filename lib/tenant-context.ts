import { AsyncLocalStorage } from "node:async_hooks";
import type { Role } from "@prisma/client";

// The tenant context is set once per request from the authenticated session, and read by
// the scoped Prisma client so every query is constrained to the current tenant. Anything
// that touches tenant-owned data outside a context is a bug, so reads throw without one.
export type TenantContext = {
  tenantId: string;
  userId?: string;
  role?: Role;
};

const storage = new AsyncLocalStorage<TenantContext>();

export function runWithTenant<T>(ctx: TenantContext, fn: () => Promise<T>): Promise<T> {
  return storage.run(ctx, fn);
}

export function getTenantContext(): TenantContext | undefined {
  return storage.getStore();
}

export function requireTenantContext(): TenantContext {
  const ctx = storage.getStore();
  if (!ctx) {
    throw new Error(
      "No tenant context is set. Tenant-owned data must be accessed inside runWithTenant().",
    );
  }
  return ctx;
}
