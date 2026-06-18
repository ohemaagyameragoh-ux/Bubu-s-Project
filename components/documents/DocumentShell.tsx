import Link from "next/link";
import type { ReactNode } from "react";
import { PrintButton } from "./PrintButton";

export type DocWorkspace = {
  name: string;
  legalName: string | null;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
};

// A branded sheet for any generated document (quote, invoice, delivery report, waybill). The
// tenant logo and details sit at the top of every document, never the operator's.
export function DocumentShell({
  workspace,
  docType,
  reference,
  dateLabel,
  backHref,
  children,
}: {
  workspace: DocWorkspace;
  docType: string;
  reference: string;
  dateLabel: string;
  backHref: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href={backHref} className="text-sm text-muted no-underline hover:text-ink">
          Back
        </Link>
        <PrintButton />
      </div>

      <div className="mx-auto rounded-2xl bg-white p-10 shadow-card print:rounded-none print:shadow-none">
        <div className="flex items-start justify-between gap-6 border-b border-line pb-6">
          <div className="flex items-start gap-3">
            {workspace.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={workspace.logoUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-clay text-lg font-semibold text-white">
                {workspace.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="font-display text-lg font-semibold text-ink">{workspace.legalName || workspace.name}</div>
              <div className="mt-1 text-xs text-muted">
                {[workspace.address, workspace.phone, workspace.email].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-semibold text-ink">{docType}</div>
            <div className="mt-1 text-sm text-muted">{reference}</div>
            <div className="text-sm text-muted">{dateLabel}</div>
          </div>
        </div>

        <div className="pt-6">{children}</div>
      </div>
    </div>
  );
}
