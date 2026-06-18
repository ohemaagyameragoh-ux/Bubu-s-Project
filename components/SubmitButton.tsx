"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./ui";

// A submit button that disables and relabels itself while the form action is pending.
export function SubmitButton({
  children,
  pendingLabel = "Working...",
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
