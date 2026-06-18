import { requireTenantUser } from "@/lib/session";

// Documents render without the app sidebar so they print and export to PDF cleanly. Still
// protected: only a signed-in tenant user can open a document.
export default async function DocumentsLayout({ children }: { children: React.ReactNode }) {
  await requireTenantUser();
  return <div className="min-h-screen bg-paper py-8 print:bg-white print:py-0">{children}</div>;
}
