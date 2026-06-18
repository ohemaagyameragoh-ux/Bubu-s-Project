"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { cn } from "@/lib/cn";
import { Alert, Card, Field, Input, Label, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { createTransactionAction, type FormState } from "@/app/(app)/transactions/new/actions";

export type CommodityOption = {
  id: string;
  name: string;
  baseUnit: string;
  units: string[];
  grades: { id: string; name: string }[];
};

const initial: FormState = {};

export function RecordTransactionForm({
  commodities,
  today,
}: {
  commodities: CommodityOption[];
  today: string;
}) {
  const [state, action] = useFormState(createTransactionAction, initial);
  const [mode, setMode] = useState<"OWNER" | "BROKER">("OWNER");
  const [commodityId, setCommodityId] = useState(commodities[0]?.id ?? "");

  const selected = useMemo(
    () => commodities.find((c) => c.id === commodityId) ?? commodities[0],
    [commodities, commodityId],
  );
  const unitOptions = useMemo(() => {
    if (!selected) return [] as string[];
    return Array.from(new Set([selected.baseUnit, ...selected.units])).filter(Boolean);
  }, [selected]);

  return (
    <form action={action}>
      <input type="hidden" name="mode" value={mode} />

      {state.error ? (
        <div className="mb-5">
          <Alert kind="error">{state.error}</Alert>
        </div>
      ) : null}

      <Card className="mb-6 p-6">
        <div className="label-caps mb-2">How are you acting on this trade</div>
        <div className="grid grid-cols-2 gap-3">
          <ModeButton
            active={mode === "OWNER"}
            onClick={() => setMode("OWNER")}
            title="Owner-Trader"
            desc="You buy and own the goods. Records profit and loss."
          />
          <ModeButton
            active={mode === "BROKER"}
            onClick={() => setMode("BROKER")}
            title="Broker"
            desc="You connect a buyer and seller. Records commission."
          />
        </div>
      </Card>

      <Card className="mb-6 p-6">
        <div className="label-caps mb-4">Trade details</div>
        <div className="grid gap-x-5 sm:grid-cols-2">
          <Field>
            <Label htmlFor="commodityId">Commodity</Label>
            <Select
              id="commodityId"
              name="commodityId"
              required
              value={commodityId}
              onChange={(e) => setCommodityId(e.target.value)}
            >
              {commodities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="grade">Grade</Label>
            <Select id="grade" name="grade" defaultValue="">
              <option value="">Not specified</option>
              {selected?.grades.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" name="quantity" type="number" step="any" min="0" required />
          </Field>
          <Field>
            <Label htmlFor="unit">Unit</Label>
            <Select id="unit" name="unit" required defaultValue={unitOptions[0]}>
              {unitOptions.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="counterparty">{mode === "OWNER" ? "Counterparty (buyer or seller)" : "Counterparty"}</Label>
            <Input id="counterparty" name="counterparty" required placeholder="Accra Grain Mills Ltd" />
          </Field>
          <Field>
            <Label htmlFor="tradeDate">Trade date</Label>
            <Input id="tradeDate" name="tradeDate" type="date" required defaultValue={today} />
          </Field>
        </div>
      </Card>

      <Card className="mb-6 p-6">
        <div className="label-caps mb-4">{mode === "OWNER" ? "Pricing and capital" : "Commission"}</div>
        {mode === "OWNER" ? (
          <div className="grid gap-x-5 sm:grid-cols-3">
            <Field>
              <Label htmlFor="buyPrice">Buy price (per unit)</Label>
              <Input id="buyPrice" name="buyPrice" type="number" step="any" min="0" placeholder="GHS" />
            </Field>
            <Field>
              <Label htmlFor="sellPrice">Sell price (per unit)</Label>
              <Input id="sellPrice" name="sellPrice" type="number" step="any" min="0" placeholder="GHS" />
            </Field>
            <Field>
              <Label htmlFor="capitalSource">Capital source</Label>
              <Input id="capitalSource" name="capitalSource" placeholder="Own funds, loan, ..." />
            </Field>
          </div>
        ) : (
          <div className="grid gap-x-5 sm:grid-cols-2">
            <Field>
              <Label htmlFor="commission">Commission</Label>
              <Input id="commission" name="commission" type="number" step="any" min="0" placeholder="GHS" />
            </Field>
          </div>
        )}
      </Card>

      <Card className="mb-6 p-6">
        <div className="label-caps mb-4">Status and notes</div>
        <div className="grid gap-x-5 sm:grid-cols-2">
          <Field>
            <Label htmlFor="paymentStatus">Payment status</Label>
            <Select id="paymentStatus" name="paymentStatus" defaultValue="UNPAID">
              <option value="UNPAID">Unpaid</option>
              <option value="PARTIAL">Partial</option>
              <option value="PAID">Paid</option>
            </Select>
          </Field>
          <Field>
            <Label htmlFor="deliveryStatus">Delivery status</Label>
            <Select id="deliveryStatus" name="deliveryStatus" defaultValue="PENDING">
              <option value="PENDING">Pending</option>
              <option value="IN_TRANSIT">In transit</option>
              <option value="DELIVERED">Delivered</option>
            </Select>
          </Field>
        </div>
        <Field>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" placeholder="Anything worth remembering about this trade." />
        </Field>
      </Card>

      <div className="flex items-center gap-3">
        <SubmitButton pendingLabel="Recording...">Record transaction</SubmitButton>
      </div>
    </form>
  );
}

function ModeButton({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-4 text-left transition-colors",
        active ? "border-clay bg-peach-soft/60" : "border-line bg-white hover:border-clay/40",
      )}
    >
      <div className={cn("font-medium", active ? "text-clay-dark" : "text-ink")}>{title}</div>
      <div className="mt-1 text-sm text-muted">{desc}</div>
    </button>
  );
}
