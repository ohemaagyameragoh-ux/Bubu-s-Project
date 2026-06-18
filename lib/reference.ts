import { Prisma } from "@prisma/client";

// Allocate a per tenant, per year human reference like QUO-2026-0007. The count callback
// returns how many of that record already exist this year, and we retry on the rare unique
// clash. The unique index per tenant is the real guard.
export async function createWithReference<T>(
  prefix: string,
  count: () => Promise<number>,
  create: (reference: string) => Promise<T>,
): Promise<T> {
  const year = new Date().getFullYear();
  const base = await count();
  for (let i = 0; i < 6; i += 1) {
    const reference = `${prefix}-${year}-${String(base + 1 + i).padStart(4, "0")}`;
    try {
      return await create(reference);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && i < 5) {
        continue;
      }
      throw error;
    }
  }
  throw new Error("Could not allocate a reference. Please try again.");
}
