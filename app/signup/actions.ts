"use server";

import { AuthError } from "next-auth";
import { z } from "zod";
import { signIn } from "@/lib/auth";
import { createWorkspace } from "@/lib/services/signup";
import type { AuthFormState } from "@/app/login/actions";

const schema = z.object({
  workspaceName: z.string().trim().min(2, "Enter your business name."),
  adminName: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
});

export async function signupAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = schema.safeParse({
    workspaceName: formData.get("workspaceName"),
    adminName: formData.get("adminName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check the form." };
  }

  try {
    await createWorkspace(parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create the workspace." };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Workspace created. Please sign in." };
    }
    throw error;
  }
}
