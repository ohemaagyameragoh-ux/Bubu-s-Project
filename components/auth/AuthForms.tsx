"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { Alert, Field, Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { loginAction, type AuthFormState } from "@/app/login/actions";
import { signupAction } from "@/app/signup/actions";

const initial: AuthFormState = {};

export function LoginForm() {
  const [state, action] = useFormState(loginAction, initial);
  return (
    <form action={action} className="space-y-1">
      {state.error ? (
        <div className="mb-4">
          <Alert kind="error">{state.error}</Alert>
        </div>
      ) : null}
      <Field>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <div className="flex items-center justify-between pt-2">
        <SubmitButton pendingLabel="Signing in...">Sign in</SubmitButton>
        <Link href="/signup" className="text-sm text-navy">
          Create a workspace
        </Link>
      </div>
    </form>
  );
}

export function SignupForm() {
  const [state, action] = useFormState(signupAction, initial);
  return (
    <form action={action} className="space-y-1">
      {state.error ? (
        <div className="mb-4">
          <Alert kind="error">{state.error}</Alert>
        </div>
      ) : null}
      <Field>
        <Label htmlFor="workspaceName">Business name</Label>
        <Input id="workspaceName" name="workspaceName" required placeholder="Acme Commodities" />
      </Field>
      <Field>
        <Label htmlFor="adminName">Your name</Label>
        <Input id="adminName" name="adminName" required />
      </Field>
      <Field>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        <p className="text-xs text-muted mt-1">At least 8 characters. You become the workspace Admin.</p>
      </Field>
      <div className="flex items-center justify-between pt-2">
        <SubmitButton pendingLabel="Creating...">Create workspace</SubmitButton>
        <Link href="/login" className="text-sm text-navy">
          I already have an account
        </Link>
      </div>
    </form>
  );
}
