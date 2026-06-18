import { requireTenantUser } from "@/lib/session";
import { countTransactions } from "@/lib/services/transactions";
import { Sidebar } from "@/components/Sidebar";

// Every page under this group requires a signed-in tenant user. The guard runs here once.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireTenantUser();
  const transactionCount = await countTransactions();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userName={user.name}
        role={user.role}
        isAdmin={user.role === "ADMIN"}
        transactionCount={transactionCount}
      />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-content px-8 py-10">{children}</div>
      </main>
    </div>
  );
}
