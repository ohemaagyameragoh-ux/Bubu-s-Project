import { prisma } from "../db";
import { hashPassword } from "../password";
import { slugify } from "../slug";

export type SignupInput = {
  workspaceName: string;
  adminName: string;
  email: string;
  password: string;
};

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let n = 1;
  // Slugs are global and unique. Append a counter until we find a free one.
  while (await prisma.tenant.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}

// Create a brand new workspace and its first Admin user. Runs unscoped because no tenant
// context exists yet: this is the moment the tenant is created.
export async function createWorkspace(input: SignupInput): Promise<{ tenantId: string; email: string }> {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("That email is already registered. Please sign in instead.");
  }

  const slug = await uniqueSlug(input.workspaceName);
  const passwordHash = await hashPassword(input.password);

  const tenant = await prisma.$transaction(async (tx) => {
    const t = await tx.tenant.create({
      data: { name: input.workspaceName.trim(), slug },
    });
    await tx.user.create({
      data: {
        email,
        name: input.adminName.trim(),
        role: "ADMIN",
        tenantId: t.id,
        passwordHash,
      },
    });
    await tx.auditLog.create({
      data: { tenantId: t.id, action: "workspace.create", entity: "Tenant", entityId: t.id },
    });
    return t;
  });

  return { tenantId: tenant.id, email };
}
