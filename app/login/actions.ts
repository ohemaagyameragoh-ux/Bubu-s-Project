"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export type AuthFormState = { error?: string };

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
    return {};
  } catch (error) {
    // A successful sign in throws a redirect, which must propagate. Only auth failures are caught.
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}
