import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { logoutAction } from "@/app/(app)/actions";
import { IconWheat } from "@/components/icons";

// Operator console shell. Only the platform super admin can reach it. It sits outside the tenant
// app group because the operator account belongs to no tenant.
export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.isPlatformAdmin) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-content items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-dark text-white">
              <IconWheat className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display text-lg font-semibold text-ink">Ace Mobility</div>
              <div className="text-xs text-muted">Operator console</div>
            </div>
          </div>
          <form action={logoutAction}>
            <button className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-content px-8 py-10">{children}</main>
    </div>
  );
}
