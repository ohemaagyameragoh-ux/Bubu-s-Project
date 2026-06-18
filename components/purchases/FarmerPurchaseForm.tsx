"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Field, Input, Label, Select } from "@/components/ui";

const QUEUE_KEY = "ace_purchase_queue";

type Payload = {
  farmerName: string;
  commodityName: string;
  grade?: string;
  grossWeight: number;
  deductions?: number;
  unit: string;
  pricePerUnit: number;
  payMethod: string;
  paid: boolean;
  location?: string;
  moisture?: number;
  foreignMatter?: number;
};

function loadQueue(): Payload[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveQueue(q: Payload[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

async function postOne(payload: Payload): Promise<void> {
  const res = await fetch("/api/purchases", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("post failed");
}

// Field agents often work with no signal. This screen saves a purchase locally if the network is
// down and syncs it automatically when the connection returns. The queue lives in the browser.
export function FarmerPurchaseForm({
  farmerNames,
  commodityNames,
}: {
  farmerNames: string[];
  commodityNames: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [message, setMessage] = useState<{ kind: "success" | "info" | "error"; text: string } | null>(null);

  const flush = useCallback(async () => {
    const queue = loadQueue();
    if (queue.length === 0) {
      setPending(0);
      return;
    }
    const remaining: Payload[] = [];
    for (const item of queue) {
      try {
        await postOne(item);
      } catch {
        remaining.push(item);
      }
    }
    saveQueue(remaining);
    setPending(remaining.length);
    if (remaining.length === 0 && queue.length > 0) {
      setMessage({ kind: "success", text: `Synced ${queue.length} queued purchase(s).` });
    }
  }, []);

  useEffect(() => {
    setOnline(navigator.onLine);
    setPending(loadQueue().length);
    void flush();
    const goOnline = () => {
      setOnline(true);
      void flush();
    };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [flush]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const num = (k: string) => {
      const v = fd.get(k);
      return v && String(v).trim() !== "" ? Number(v) : undefined;
    };
    const payload: Payload = {
      farmerName: String(fd.get("farmerName") ?? "").trim(),
      commodityName: String(fd.get("commodityName") ?? "").trim(),
      grade: String(fd.get("grade") ?? "").trim() || undefined,
      grossWeight: num("grossWeight") ?? 0,
      deductions: num("deductions") ?? 0,
      unit: String(fd.get("unit") ?? "kg"),
      pricePerUnit: num("pricePerUnit") ?? 0,
      payMethod: String(fd.get("payMethod") ?? "MOBILE_MONEY"),
      paid: fd.get("paid") === "on",
      location: String(fd.get("location") ?? "").trim() || undefined,
      moisture: num("moisture"),
      foreignMatter: num("foreignMatter"),
    };

    if (!payload.farmerName || !payload.commodityName || payload.grossWeight <= 0) {
      setMessage({ kind: "error", text: "Enter farmer, commodity, and weight." });
      return;
    }

    try {
      await postOne(payload);
      setMessage({ kind: "success", text: "Purchase recorded and added to stock." });
      formRef.current?.reset();
      void flush();
    } catch {
      const q = loadQueue();
      q.push(payload);
      saveQueue(q);
      setPending(q.length);
      setMessage({ kind: "info", text: "No connection. Saved on this device and will sync when you are back online." });
      formRef.current?.reset();
    }
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <span className="label-caps">Record a purchase</span>
        <span className="flex items-center gap-2 text-xs">
          <span className={"h-2 w-2 rounded-full " + (online ? "bg-forest" : "bg-clay")} />
          <span className="text-muted">{online ? "Online" : "Offline"}</span>
          {pending > 0 ? <span className="rounded-full bg-peach-soft px-2 py-0.5 text-clay-dark">{pending} queued</span> : null}
        </span>
      </div>

      {message ? (
        <div className="mb-4">
          <Alert kind={message.kind}>{message.text}</Alert>
        </div>
      ) : null}

      <datalist id="farmer-names">
        {farmerNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <datalist id="purchase-commodities">
        {commodityNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <form ref={formRef} onSubmit={onSubmit}>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field>
            <Label htmlFor="farmerName">Farmer</Label>
            <Input id="farmerName" name="farmerName" list="farmer-names" required />
          </Field>
          <Field>
            <Label htmlFor="commodityName">Commodity</Label>
            <Input id="commodityName" name="commodityName" list="purchase-commodities" required />
          </Field>
          <Field>
            <Label htmlFor="grade">Grade</Label>
            <Input id="grade" name="grade" />
          </Field>
          <Field>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="Buying point" />
          </Field>
          <Field>
            <Label htmlFor="grossWeight">Gross weight</Label>
            <Input id="grossWeight" name="grossWeight" type="number" step="any" min="0" required />
          </Field>
          <Field>
            <Label htmlFor="deductions">Deductions</Label>
            <Input id="deductions" name="deductions" type="number" step="any" min="0" defaultValue="0" />
          </Field>
          <Field>
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" name="unit" defaultValue="kg" required />
          </Field>
          <Field>
            <Label htmlFor="pricePerUnit">Price per unit (GHS)</Label>
            <Input id="pricePerUnit" name="pricePerUnit" type="number" step="any" min="0" required />
          </Field>
          <Field>
            <Label htmlFor="moisture">Moisture (%)</Label>
            <Input id="moisture" name="moisture" type="number" step="any" min="0" />
          </Field>
          <Field>
            <Label htmlFor="foreignMatter">Foreign matter (%)</Label>
            <Input id="foreignMatter" name="foreignMatter" type="number" step="any" min="0" />
          </Field>
          <Field>
            <Label htmlFor="payMethod">Payment method</Label>
            <Select id="payMethod" name="payMethod" defaultValue="MOBILE_MONEY">
              <option value="MOBILE_MONEY">Mobile money</option>
              <option value="CASH">Cash</option>
              <option value="BANK">Bank</option>
            </Select>
          </Field>
          <Field>
            <Label htmlFor="paid">Paid</Label>
            <label className="flex items-center gap-2 py-2 text-sm text-ink">
              <input type="checkbox" id="paid" name="paid" className="h-4 w-4" />
              Paid the farmer now (records a receipt)
            </label>
          </Field>
        </div>
        <Button type="submit">Record purchase</Button>
      </form>
    </Card>
  );
}
