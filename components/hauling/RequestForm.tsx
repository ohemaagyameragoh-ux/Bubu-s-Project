"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState } from "react-dom";
import { Alert, Button, Card, Field, Input, Label, Select } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { createRequestAction, type FormState } from "@/app/(app)/hauling/actions";

const initial: FormState = {};

export function RequestForm() {
  const [state, action] = useFormState(createRequestAction, initial);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.ok]);

  return (
    <div className="mb-6">
      <Button variant={open ? "secondary" : "primary"} onClick={() => setOpen((o) => !o)}>
        {open ? "Close" : "+ Request haulage"}
      </Button>
      {open ? (
        <Card className="mt-4">
          <form action={action} ref={ref}>
            {state.error ? (
              <div className="mb-4">
                <Alert kind="error">{state.error}</Alert>
              </div>
            ) : null}
            <div className="grid gap-x-4 sm:grid-cols-3">
              <Field>
                <Label htmlFor="pickup">Pickup</Label>
                <Input id="pickup" name="pickup" required placeholder="Tamale" />
              </Field>
              <Field>
                <Label htmlFor="dropoff">Drop-off</Label>
                <Input id="dropoff" name="dropoff" required placeholder="Accra" />
              </Field>
              <Field>
                <Label htmlFor="commodityName">Commodity</Label>
                <Input id="commodityName" name="commodityName" required />
              </Field>
              <Field>
                <Label htmlFor="tonnage">Tonnage (MT)</Label>
                <Input id="tonnage" name="tonnage" type="number" step="any" min="0" required />
              </Field>
              <Field>
                <Label htmlFor="vehicleType">Vehicle type</Label>
                <Input id="vehicleType" name="vehicleType" placeholder="Flatbed truck" required />
              </Field>
              <Field>
                <Label htmlFor="pickupDate">Pickup date</Label>
                <Input id="pickupDate" name="pickupDate" type="date" />
              </Field>
              <Field>
                <Label htmlFor="commissionFeePct">Platform fee (%)</Label>
                <Input id="commissionFeePct" name="commissionFeePct" type="number" step="any" min="0" max="100" defaultValue="5" />
              </Field>
              <Field>
                <Label htmlFor="chargeTo">Charge fee to</Label>
                <Select id="chargeTo" name="chargeTo" defaultValue="TRANSPORTER">
                  <option value="TRANSPORTER">Transporter payout</option>
                  <option value="REQUESTER">Requester</option>
                </Select>
              </Field>
            </div>
            <SubmitButton pendingLabel="Posting...">Post request</SubmitButton>
          </form>
        </Card>
      ) : null}
    </div>
  );
}
