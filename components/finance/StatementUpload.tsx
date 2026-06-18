"use client";

import { useRef } from "react";
import { useFormState } from "react-dom";
import { Alert, Card, Field, Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { uploadStatementAction, type FormState } from "@/app/(app)/finance/statements/actions";

const initial: FormState = {};

export function StatementUpload() {
  const [state, action] = useFormState(uploadStatementAction, initial);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (nameRef.current) nameRef.current.value = file.name;
    file.text().then((t) => {
      if (textRef.current) textRef.current.value = t;
    });
  }

  return (
    <Card>
      <div className="label-caps mb-4">Upload a statement</div>
      <form action={action}>
        {state.error ? (
          <div className="mb-4">
            <Alert kind="error">{state.error}</Alert>
          </div>
        ) : null}
        {state.ok ? (
          <div className="mb-4">
            <Alert kind="success">Statement analyzed. Each line was categorized and reconciled below.</Alert>
          </div>
        ) : null}
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field>
            <Label htmlFor="account">Account</Label>
            <Input id="account" name="account" placeholder="MTN MoMo or GCB current" />
          </Field>
          <Field>
            <Label htmlFor="file">CSV file</Label>
            <input
              id="file"
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
            />
          </Field>
        </div>
        <input type="hidden" name="fileName" ref={nameRef} defaultValue="statement.csv" />
        <Field>
          <Label htmlFor="csvText">Or paste lines (date, description, amount)</Label>
          <textarea
            id="csvText"
            name="csvText"
            ref={textRef}
            className="min-h-32 w-full rounded-lg border border-line bg-white px-3 py-2 font-mono text-xs text-ink outline-none focus:border-clay/50"
            placeholder={"2026-06-10, Payment from Accra Grain Mills, 612000\n2026-06-09, Mobile money to farmer Kofi, -48000\n2026-06-08, SMS charges, -12"}
          />
        </Field>
        <SubmitButton pendingLabel="Analyzing...">Analyze statement</SubmitButton>
      </form>
    </Card>
  );
}
