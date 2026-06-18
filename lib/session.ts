import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "./auth";
import { runWithTenant } from "./tenant-context";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  tenantId: string | null;
  role: Role | null;
  isPlatformAdmin: boolean;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  const u = session.user;
  return {
    id: u.id,
    email: u.email ?? "",
    name: u.name ?? "",
    tenantId: u.tenantId,
    role: u.role,
    isPlatformAdmin: u.isPlatformAdmin,
  };
}

// Require a signed-in tenant user. Redirects to login when absent.
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireTenantUser(): Promise<SessionUser & { tenantId: string }> {
  const user = await requireUser();
  if (!user.tenantId) redirect("/login");
  return user as SessionUser & { tenantId: string };
}

export async function requireRole(roles: Role[]): Promise<SessionUser & { tenantId: string }> {
  const user = await requireTenantUser();
  if (!user.role || !roles.includes(user.role)) redirect("/dashboard");
  return user;
}

// Run a function inside the current user's tenant context. This is the bridge between the
// Auth.js session and the tenant-scoped Prisma client: every tenant data access goes through
// here (directly or via a service), so the tenantId is always set and never guessed.
export async function withTenantSession<T>(fn: () => Promise<T>): Promise<T> {
  const user = await requireTenantUser();
  return runWithTenant(
    { tenantId: user.tenantId, userId: user.id, role: user.role ?? undefined },
    fn,
  );
}
