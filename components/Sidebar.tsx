"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/cn";
import { roleLabel } from "@/lib/roles";
import type { Role } from "@prisma/client";
import { logoutAction } from "@/app/(app)/actions";
import {
  IconBuilding,
  IconChart,
  IconCoins,
  IconDashboard,
  IconDoc,
  IconList,
  IconPlug,
  IconStore,
  IconTrend,
  IconTruck,
  IconUsers,
  IconWheat,
} from "@/components/icons";

type Item = { href: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; count?: number };
type Section = { title: string; items: Item[] };

export function Sidebar({
  userName,
  role,
  isAdmin,
  transactionCount,
}: {
  userName: string;
  role: Role | null;
  isAdmin: boolean;
  transactionCount: number;
}) {
  const pathname = usePathname();

  const sections: Section[] = [
    {
      title: "Trade",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: IconDashboard },
        { href: "/transactions", label: "Transactions", icon: IconList, count: transactionCount },
        { href: "/leads", label: "Leads", icon: IconUsers },
        { href: "/quotes", label: "Quotes", icon: IconDoc },
        { href: "/orders", label: "Orders", icon: IconList },
        { href: "/reports", label: "Reports", icon: IconChart },
      ],
    },
    {
      title: "Operations",
      items: [
        { href: "/stock", label: "Stock", icon: IconWheat },
        { href: "/purchases", label: "Farmer purchases", icon: IconCoins },
        { href: "/logistics", label: "Logistics", icon: IconTruck },
        { href: "/clients", label: "Clients", icon: IconUsers },
        { href: "/farmers", label: "Farmers", icon: IconUsers },
      ],
    },
    {
      title: "Network",
      items: [
        { href: "/marketplace", label: "Marketplace", icon: IconStore },
        { href: "/hauling", label: "Hauling", icon: IconTruck },
        { href: "/price-intelligence", label: "Price intelligence", icon: IconTrend },
      ],
    },
    {
      title: "Finance",
      items: [
        { href: "/invoices", label: "Invoices", icon: IconDoc },
        { href: "/finance/ledger", label: "Ledger", icon: IconChart },
        { href: "/finance/statements", label: "Statements", icon: IconDoc },
        { href: "/finance/cash-flow", label: "Cash flow", icon: IconTrend },
      ],
    },
    {
      title: "Settings",
      items: [
        { href: "/settings/commodities", label: "Commodities", icon: IconWheat },
        ...(isAdmin ? [{ href: "/settings/staff", label: "Staff", icon: IconUsers }] : []),
        { href: "/settings/integrations", label: "Integrations", icon: IconPlug },
        { href: "/settings/workspace", label: "Workspace", icon: IconBuilding },
      ],
    },
  ];

  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-paper print:hidden">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay text-white">
          <IconWheat className="h-6 w-6" />
        </div>
        <span className="font-display text-xl font-semibold text-ink">Ace Mobility</span>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-3 pb-1 label-caps">{section.title}</div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm no-underline transition-colors",
                      active ? "bg-forest-dark text-white" : "text-ink/80 hover:bg-black/[0.04]",
                    )}
                  >
                    <Icon className={cn("h-5 w-5 shrink-0", active ? "text-white" : "text-muted")} />
                    <span className={cn("flex-1 font-medium", active ? "text-white" : "")}>{item.label}</span>
                    {item.count != null ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs",
                          active ? "bg-white/20 text-white" : "bg-white text-muted",
                        )}
                      >
                        {item.count}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-line p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-clay/15 text-sm font-semibold text-clay-dark">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-ink">{userName}</div>
            <div className="truncate text-xs text-muted">{roleLabel(role)}</div>
          </div>
        </div>
        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
