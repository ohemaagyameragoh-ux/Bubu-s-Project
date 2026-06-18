"use client";

import { useFormState } from "react-dom";
import { Alert, Card, Field, Input, Label } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { formatQuantity, formatDate } from "@/lib/format";
import { createTripAction, type FormState } from "@/app/(app)/logistics/actions";

export type LotOption = {
  id: string;
  reference: string;
  commodityName: string;
  grade: string | null;
  remainingWeight: number;
  unit: string;
  createdAt: string;
};

const initial: FormState = {};

export function NewTripForm({ lots }: { lots: LotOption[] }) {
  const [state, action] = useFormState(createTripAction, initial);

  return (
    <form action={action}>
      {state.error ? (
        <div className="mb-5">
          <Alert kind="error">{state.error}</Alert>
        </div>
      ) : null}

      <Card className="mb-6">
        <div className="label-caps mb-4">Truck and dispatch</div>
        <div className="grid gap-x-5 sm:grid-cols-3">
          <Field>
            <Label htmlFor="commodityName">Commodity</Label>
            <Input id="commodityName" name="commodityName" required />
          </Field>
          <Field>
            <Label htmlFor="truck">Truck</Label>
            <Input id="truck" name="truck" required placeholder="GT-1234-22" />
          </Field>
          <Field>
            <Label htmlFor="driver">Driver</Label>
            <Input id="driver" name="driver" required />
          </Field>
          <Field>
            <Label htmlFor="transporterName">Transporter</Label>
            <Input id="transporterName" name="transporterName" />
          </Field>
          <Field>
            <Label htmlFor="freightRate">Freight rate (GHS)</Label>
            <Input id="freightRate" name="freightRate" type="number" step="any" min="0" />
          </Field>
          <Field>
            <Label htmlFor="sealNumber">Seal number</Label>
            <Input id="sealNumber" name="sealNumber" />
          </Field>
          <Field>
            <Label htmlFor="weighbridgeIn">Weighbridge in</Label>
            <Input id="weighbridgeIn" name="weighbridgeIn" type="number" step="any" min="0" />
          </Field>
          <Field>
            <Label htmlFor="weighbridgeOut">Weighbridge out</Label>
            <Input id="weighbridgeOut" name="weighbridgeOut" type="number" step="any" min="0" />
          </Field>
          <Field>
            <Label htmlFor="bagCount">Bag count</Label>
            <Input id="bagCount" name="bagCount" type="number" min="0" />
          </Field>
        </div>
      </Card>

      <Card className="mb-6">
        <div className="label-caps mb-1">Load lots (oldest first for traceability)</div>
        <p className="mb-4 text-sm text-muted">Tick the lots going on this truck and confirm the weight from each.</p>
        {lots.length === 0 ? (
          <p className="text-sm text-muted">No lots in stock to load.</p>
        ) : (
          <div className="space-y-2">
            {lots.map((lot) => (
              <div key={lot.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="lotSel" value={lot.id} className="h-4 w-4" />
                  <span className="font-medium text-ink">{lot.reference}</span>
                </label>
                <span className="text-sm text-muted">
                  {lot.commodityName}
                  {lot.grade ? ` (${lot.grade})` : ""} · {formatQuantity(lot.remainingWeight, lot.unit)} · bought{" "}
                  {formatDate(lot.createdAt)}
                </span>
                <span className="ml-auto flex items-center gap-2 text-sm">
                  <span className="text-muted">Load</span>
                  <input
                    name={`weight_${lot.id}`}
                    type="number"
                    step="any"
                    min="0"
                    max={lot.remainingWeight}
                    defaultValue={lot.remainingWeight}
                    className="w-28 rounded-lg border border-line px-2 py-1"
                  />
                  <span className="text-muted">{lot.unit}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <SubmitButton pendingLabel="Creating...">Create trip and waybill</SubmitButton>
    </form>
  );
}
