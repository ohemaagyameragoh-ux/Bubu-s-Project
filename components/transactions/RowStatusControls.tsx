"use client";

import { useRef } from "react";
import type { PaymentStatus, DeliveryStatus, Lifecycle } from "@prisma/client";
import { updateStatusAction } from "@/app/(app)/transactions/actions";

const selectClass =
  "rounded-lg border border-line bg-white px-2 py-1 text-xs text-ink outline-none focus:border-clay/50";

// Inline status editor for one row. Any change submits immediately, then the list revalidates
// and the derived lifecycle badge updates. The override lets a user pin a state by hand.
export function RowStatusControls({
  id,
  paymentStatus,
  deliveryStatus,
  statusOverride,
}: {
  id: string;
  paymentStatus: PaymentStatus;
  deliveryStatus: DeliveryStatus;
  statusOverride: Lifecycle | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const submit = () => formRef.current?.requestSubmit();

  return (
    <form ref={formRef} action={updateStatusAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <select name="paymentStatus" defaultValue={paymentStatus} onChange={submit} className={selectClass} title="Payment">
        <option value="UNPAID">Unpaid</option>
        <option value="PARTIAL">Partial</option>
        <option value="PAID">Paid</option>
      </select>
      <select name="deliveryStatus" defaultValue={deliveryStatus} onChange={submit} className={selectClass} title="Delivery">
        <option value="PENDING">Pending</option>
        <option value="IN_TRANSIT">In transit</option>
        <option value="DELIVERED">Delivered</option>
      </select>
      <select
        name="statusOverride"
        defaultValue={statusOverride ?? "AUTO"}
        onChange={submit}
        className={selectClass}
        title="Lifecycle override"
      >
        <option value="AUTO">Auto</option>
        <option value="ACTIVE">Active</option>
        <option value="PENDING">Pending</option>
        <option value="COMPLETED">Completed</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
    </form>
  );
}
