import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

// Presentational primitives for the Ace Mobility design system. No client hooks here, so they
// render on the server or the client.

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-card shadow-card", className ?? "p-6")}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
  eyebrow,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow ? <div className="label-caps mb-2">{eyebrow}</div> : null}
        <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-ink">
      {children}
    </label>
  );
}

export function Field({ children }: { children: ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

const inputBase =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-clay/50 focus:ring-2 focus:ring-clay/15";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputBase, "min-h-20", props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputBase, "bg-white", props.className)} />;
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" }) {
  const styles = {
    primary: "bg-clay text-white hover:bg-clay-dark shadow-card",
    secondary: "border border-line bg-white text-ink hover:border-clay/40",
    danger: "border border-line bg-white text-clay-dark hover:border-clay/40",
    ghost: "text-muted hover:text-ink",
  }[variant];
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60",
        styles,
        className,
      )}
    />
  );
}

export function Alert({ kind = "error", children }: { kind?: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-clay/30 bg-peach-soft text-clay-dark",
    success: "border-forest/20 bg-green-soft text-forest-dark",
    info: "border-line bg-paper text-ink",
  }[kind];
  return <div className={cn("rounded-xl border px-3 py-2 text-sm", styles)}>{children}</div>;
}

// A pill badge. Use the role and status helpers below for the standard cases.
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "blue" | "peach";
}) {
  const styles = {
    neutral: "bg-paper text-muted border border-line",
    green: "bg-green-soft text-forest-dark",
    blue: "bg-blue-soft text-ocean",
    peach: "bg-peach-soft text-clay-dark",
  }[tone];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", styles)}>
      {children}
    </span>
  );
}

export function RoleBadge({ mode }: { mode: "OWNER" | "BROKER" }) {
  return mode === "OWNER" ? <Badge tone="green">Owner-Trader</Badge> : <Badge tone="blue">Broker</Badge>;
}

export function StatusBadge({ status }: { status: "ACTIVE" | "PENDING" | "COMPLETED" | "CANCELLED" }) {
  const map = {
    ACTIVE: { tone: "peach" as const, label: "Active" },
    PENDING: { tone: "peach" as const, label: "Pending" },
    COMPLETED: { tone: "green" as const, label: "Completed" },
    CANCELLED: { tone: "neutral" as const, label: "Cancelled" },
  }[status];
  return <Badge tone={map.tone}>{map.label}</Badge>;
}

// A dashboard stat tile. The accent color tints the big serif number.
export function StatCard({
  label,
  value,
  sub,
  accent = "ink",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "ink" | "forest" | "ocean" | "clay";
}) {
  const color = { ink: "text-ink", forest: "text-forest", ocean: "text-ocean", clay: "text-clay" }[accent];
  return (
    <Card className="p-5">
      <div className="label-caps">{label}</div>
      <div className={cn("mt-2 font-display text-3xl font-semibold leading-tight", color)}>{value}</div>
      {sub ? <div className="mt-1 text-sm text-muted">{sub}</div> : null}
    </Card>
  );
}
