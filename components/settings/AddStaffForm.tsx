"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { Alert, Field, Input, Label, Select } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { ROLE_OPTIONS } from "@/lib/roles";
import { addStaffAction, type FormState } from "@/app/(app)/settings/staff/actions";

const initial: FormState = {};

export function AddStaffForm() {
  const [state, action] = useFormState(addStaffAction, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  return (
    <form action={action} ref={ref}>
      {state.error ? (
        <div className="mb-4">
          <Alert kind="error">{state.error}</Alert>
        </div>
      ) : null}
      {state.ok ? (
        <div className="mb-4">
          <Alert kind="success">Staff member added. Share the temporary password with them.</Alert>
        </div>
      ) : null}

      <div className="grid gap-x-5 sm:grid-cols-2">
        <Field>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </Field>
        <Field>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </Field>
        <Field>
          <Label htmlFor="role">Role</Label>
          <Select id="role" name="role" required defaultValue="SALES">
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="password">Temporary password</Label>
          <Input id="password" name="password" type="text" minLength={8} required />
        </Field>
      </div>

      <SubmitButton pendingLabel="Adding...">Add staff member</SubmitButton>
    </form>
  );
}
