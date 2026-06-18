import type { Role } from "@prisma/client";
import { prisma } from "../db";
import { withTenantSession } from "../session";
import { requireTenantContext } from "../tenant-context";
import { hashPassword } from "../password";
import { recordAudit } from "../audit";

export type StaffInput = {
  email: string;
  name: string;
  role: Role;
  password: string;
};

// User rows are filtered by tenantId explicitly (User is not in the auto-scoped set, since
// auth needs unscoped access). Every query and mutation below pins tenantId from context.
export async function listStaff() {
  return withTenantSession(async () => {
    const { tenantId } = requireTenantContext();
    return prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
  });
}

export async function addStaff(input: StaffInput) {
  return withTenantSession(async () => {
    const { tenantId } = requireTenantContext();
    const email = input.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("A user with that email already exists.");
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: input.name.trim(),
        role: input.role,
        tenantId,
        passwordHash: await hashPassword(input.password),
      },
      select: { id: true, email: true, name: true, role: true },
    });
    await recordAudit({ action: "staff.add", entity: "User", entityId: user.id, metadata: { role: input.role } });
    return user;
  });
}

export async function updateStaffRole(userId: string, role: Role) {
  return withTenantSession(async () => {
    const { tenantId } = requireTenantContext();
    // tenantId in the where guards against editing a user from another workspace.
    const updated = await prisma.user.update({
      where: { id: userId, tenantId },
      data: { role },
      select: { id: true, role: true },
    });
    await recordAudit({ action: "staff.role.update", entity: "User", entityId: userId, metadata: { role } });
    return updated;
  });
}

export async function removeStaff(userId: string) {
  return withTenantSession(async () => {
    const { tenantId, userId: actingUserId } = requireTenantContext();
    if (userId === actingUserId) {
      throw new Error("You cannot remove your own account.");
    }
    await prisma.user.delete({ where: { id: userId, tenantId } });
    await recordAudit({ action: "staff.remove", entity: "User", entityId: userId });
  });
}
