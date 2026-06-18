"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Role } from "@prisma/client";
import { addStaff, removeStaff, updateStaffRole } from "@/lib/services/staff";
import { requireRole } from "@/lib/session";

export type FormState = { error?: string; ok?: boolean };

const roleEnum = z.nativeEnum(Role);

const addSchema = z.object({
  name: z.string().trim().min(2, "Enter the person's name."),
  email: z.string().trim().email("Enter a valid email."),
  role: roleEnum,
  password: z.string().min(8, "Use at least 8 characters for the temporary password."),
});

export async function addStaffAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireRole([Role.ADMIN]);

  const parsed = addSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  try {
    await addStaff(parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not add the staff member." };
  }

  revalidatePath("/settings/staff");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateStaffRoleAction(formData: FormData): Promise<void> {
  await requireRole([Role.ADMIN]);
  const id = String(formData.get("id") ?? "");
  const role = roleEnum.safeParse(formData.get("role"));
  if (!id || !role.success) return;
  await updateStaffRole(id, role.data);
  revalidatePath("/settings/staff");
}

export async function removeStaffAction(formData: FormData): Promise<void> {
  await requireRole([Role.ADMIN]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await removeStaff(id);
  revalidatePath("/settings/staff");
}
