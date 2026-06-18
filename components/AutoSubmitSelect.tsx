"use client";

// A select that submits its enclosing form on change. Lives in a client component so the event
// handler is allowed. Drop it inside a server-rendered <form action={...}>.
export function AutoSubmitSelect({
  name,
  defaultValue,
  options,
  className,
  title,
}: {
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  className?: string;
  title?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      title={title}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className={className ?? "rounded-lg border border-line bg-white px-2 py-1 text-xs"}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
