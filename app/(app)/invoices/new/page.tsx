import { PageHeader } from "@/components/ui";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";

export const dynamic = "force-dynamic";

export default function NewInvoicePage() {
  return (
    <div>
      <PageHeader eyebrow="New invoice" title="Raise an invoice" subtitle="Bill the client for the accepted quantity at the agreed price. Part payments and credit terms are supported." />
      <InvoiceForm />
    </div>
  );
}
