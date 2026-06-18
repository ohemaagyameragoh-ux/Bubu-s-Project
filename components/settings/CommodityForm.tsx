"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { Alert, Field, Input, Label, Button } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { createCommodityAction, type FormState } from "@/app/(app)/settings/commodities/actions";

const initial: FormState = {};

type Row = { key: number };
let counter = 0;
const newRow = (): Row => ({ key: counter++ });

export function CommodityForm() {
  const [state, action] = useFormState(createCommodityAction, initial);
  const [grades, setGrades] = useState<Row[]>([newRow()]);
  const [params, setParams] = useState<Row[]>([newRow()]);
  const formRef = useRef<HTMLFormElement>(null);

  // Reset the form once a commodity is saved so the next one starts clean.
  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setGrades([newRow()]);
      setParams([newRow()]);
    }
  }, [state.ok]);

  return (
    <form action={action} ref={formRef}>
      {state.error ? (
        <div className="mb-4">
          <Alert kind="error">{state.error}</Alert>
        </div>
      ) : null}
      {state.ok ? (
        <div className="mb-4">
          <Alert kind="success">Commodity added.</Alert>
        </div>
      ) : null}

      <div className="grid gap-x-5 sm:grid-cols-2">
        <Field>
          <Label htmlFor="name">Commodity name</Label>
          <Input id="name" name="name" required placeholder="Maize" />
        </Field>
        <Field>
          <Label htmlFor="baseUnit">Base unit</Label>
          <Input id="baseUnit" name="baseUnit" required defaultValue="kg" />
        </Field>
      </div>
      <Field>
        <Label htmlFor="units">Other units (comma separated)</Label>
        <Input id="units" name="units" placeholder="kg, bag, mt" />
      </Field>
      <Field>
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" />
      </Field>

      <div className="mt-2 mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-navy">Grades</span>
        <Button type="button" variant="secondary" onClick={() => setGrades((g) => [...g, newRow()])}>
          Add grade
        </Button>
      </div>
      <div className="space-y-2 mb-5">
        {grades.map((row) => (
          <div key={row.key} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Input name="gradeName" placeholder="Grade A" />
            <Input name="gradeDescription" placeholder="Description (optional)" />
            <Button
              type="button"
              variant="danger"
              onClick={() => setGrades((g) => (g.length > 1 ? g.filter((r) => r.key !== row.key) : g))}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-2 mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-navy">Quality parameters</span>
        <Button type="button" variant="secondary" onClick={() => setParams((p) => [...p, newRow()])}>
          Add parameter
        </Button>
      </div>
      <div className="space-y-2 mb-6">
        {params.map((row) => (
          <div key={row.key} className="grid gap-2 sm:grid-cols-[1fr_120px_140px_auto]">
            <Input name="qpName" placeholder="Moisture" />
            <Input name="qpUnit" placeholder="%" />
            <Input name="qpMax" placeholder="Max (optional)" inputMode="decimal" />
            <Button
              type="button"
              variant="danger"
              onClick={() => setParams((p) => (p.length > 1 ? p.filter((r) => r.key !== row.key) : p))}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <SubmitButton pendingLabel="Adding...">Add commodity</SubmitButton>
    </form>
  );
}
