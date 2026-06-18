# Commodity Trading Platform: Architecture and Build Plan

This document is the agreed build plan. No product code is written until it is approved.
House rule for this whole document and the codebase: no em dashes anywhere. Commas, periods,
parentheses, and colons only.

## 1. What we are building

A multi-tenant SaaS where any commodity trader (maize, soya, rice, cashew, shea, anything) signs
up, gets a private workspace, and runs their whole trading operation: recording trades, sales
pipeline, quotes and invoices, buying from farmers, stock, logistics, finance, two marketplaces,
and AI price forecasting. The operator (us) runs the platform and earns from brokered marketplace
margin, hauling commission, and optional future subscriptions.

Hard requirement above all else: one tenant can never see another tenant's data. Any cross-tenant
read or write is treated as a security bug, not a feature gap.

## 2. The existing Buildboard

The current repo is a small "Buildboard" roadmap tracker, not the product. Per decision, we replace
it in place. We keep `commodity_trading.md` and this `PLAN.md` as reference, and remove the
buildboard `app/`, `lib/projects.ts`, `components/*`, and the buildboard Prisma schema and seed as
part of Milestone 0. We reuse the Next.js, TypeScript, and Tailwind tooling that is already set up.

## 3. Stack

- Framework: Next.js 14 (App Router) with TypeScript and Server Actions. (already present)
- Styling: Tailwind CSS. (already present)
- Database: PostgreSQL via Prisma. Local dev runs Postgres in Docker (compose file added in M0).
  We move off SQLite because true multi-tenancy, row-level safety, and concurrent writes need it.
- Auth: Auth.js (NextAuth v5) with email plus password credentials. The session carries `userId`,
  `tenantId`, and `role`.
- Background and AI: the Anthropic API (Claude) for the statement analyzer and price forecasting.
  Default model split, confirmed at implementation time: `claude-haiku-4-5` for high-volume
  statement-line classification, `claude-sonnet-4-6` for forecasting and heavier reasoning,
  escalating to `claude-opus-4-8` only where needed.
- Documents: server-rendered branded PDFs (quotes, invoices, delivery reports, waybills) using a
  React-to-PDF renderer, stamped with the tenant logo and details.
- Field capture: a PWA buying screen that works offline (IndexedDB queue) and syncs on reconnect.

## 4. Multi-tenancy and isolation (the spine)

1. Every tenant-owned table has a non-null `tenantId` column with a foreign key and an index.
2. A per-request tenant context (AsyncLocalStorage) is set from the authenticated session.
3. A Prisma client extension automatically injects `where: { tenantId }` on every read and sets
   `tenantId` on every create for tenant-owned models. Code cannot accidentally query across tenants.
4. Operator-only tables (PlatformLedgerEntry, tenant oversight) live outside the tenant filter and
   are reachable only by the super-admin role.
5. Automated isolation tests: seed two tenants, assert that every list, report, search, and detail
   route returns only the caller's rows. These tests gate every milestone.

## 5. Roles (RBAC)

Per workspace: Admin, Sales/Administrator, Procurement/Field Agent, Logistics, Finance. Plus the
platform-level Super Admin (operator only, never visible to tenants). Permissions are enforced in
server actions and route guards, not just hidden in the UI.

## 6. Core data model (entities)

Tenant, User, Commodity (with grades, units, quality parameters), Counterparty (client, farmer,
and transporter subtypes), Lead and PipelineStage, Quote and QuoteLine, Transaction (the core
record, with an owner-trader or broker mode), InventoryLot, FarmerPurchase, Trip/Dispatch, Waybill,
GoodsReceivedNote, HaulingRequest, HaulingQuote, MarketplaceListing (buy request or sell offer),
MarketplaceDeal (including the two-leg platform flow), PriceHistory, PriceForecast, Invoice,
Payment, LedgerEntry, PlatformLedgerEntry (operator only), BankStatement and StatementLine,
Document, IntegrationCredential, and AuditLog. Every tenant-owned row carries `tenantId`.

## 7. Cross-cutting rules enforced everywhere

- No em dashes: an ESLint rule plus a CI check fails the build if an em dash appears in source,
  copy, or comments.
- Money safety: every money action writes an AuditLog row (who, what, when). The system never sends
  a payment on its own. A payout or payment always requires an explicit user click.
- Forecasts always render a confidence indicator and a disclaimer.
- Branding: all generated documents carry the tenant's logo and details, never the operator's.
- Offline: the farmer-buying screens queue locally and sync later.

## 8. Build order (milestones)

Each milestone is shippable and must not break earlier ones. This is the sequence.

- M0 Foundation: reset the repo off the buildboard, Postgres plus Prisma, Auth.js, Tenant and User
  and roles, the tenant-context isolation layer plus isolation tests, tenant onboarding (workspace,
  branding upload, commodity setup with grades and units), AuditLog scaffolding, and the no-em-dash
  CI check.
- M1 Core MVP (first ship): record a Transaction in either mode (owner-trader or broker) with the
  correct required fields, derive the lifecycle (active, pending, completed, cancelled) from payment
  and delivery state with a manual override, a filterable dashboard (commodity, date, role, client,
  status) with inline status updates, and two separate reports: owner profit and loss, and broker
  commission income, with exports.
- M2 Owner operations: CRM with leads from WhatsApp logged against a client, the pipeline (lead,
  quote sent, negotiating, closed, pending, lost) as a sales forecast, the quote builder plus
  branded downloadable and emailable document, the stock gap view (needed, on hand, to source),
  farmer purchases with weigh, grade, deductions, mobile-money receipt, and tracked lots, the
  offline PWA buying screen, and invoicing with partials and credit terms.
- M3 Logistics: dispatch and loading (truck, driver, freight, oldest-lot-first selection,
  weighbridge in and out, bag count, seal number, waybill), in-transit and delivery tracking,
  received-weight and seal-intact capture, dispatched-versus-received variance, trip cost close-out,
  the delivery report sent by email or WhatsApp, and a sync back to the transaction delivery status.
- M4 Finance depth: the self-populating ledger (purchases as cost, receipts as revenue, freight and
  commissions as costs), margin per order, commodity, and client, live receivables and payables, the
  statement analyzer (upload PDF or CSV, classify each line with Claude, reconcile, flag mismatches),
  the price-history database with AI forecasts that always carry confidence and a disclaimer, and the
  cash-flow squeeze forecast.
- M5 Trader marketplace: buy requests and sell offers on a searchable board, automated matching by
  commodity, grade, region, and price, negotiation and acceptance that auto-creates a transaction,
  the two-leg platform flow that keeps the spread on the operator ledger, and trust features
  (verification, ratings, disputes).
- M6 Hauling marketplace: post a haulage request, transporters quote, the trader books directly,
  status tracking from requested to delivered fed back to the transaction, and a configurable
  commission engine that posts to the operator ledger.
- M7 Platform administration: super-admin oversight of all tenants, the internal operations ledger
  for brokered margin and freight commission kept strictly separate from tenant reports, and plan and
  subscription management.

## 9. Integrations (abstracted, stubbed in dev)

WhatsApp (inbound leads and outbound quotes, delivery updates, reminders), email (per-tenant sender
for quotes, reports, invoices), mobile money and bank (farmer payouts, client receipts, statement
feed), and optional outside price feeds. Each sits behind a provider interface so dev uses stubs and
production plugs in real credentials per tenant. No real money ever moves without an explicit click.

## 10. First concrete step after approval

Begin M0: scaffold Postgres plus Prisma and the docker-compose, stand up Auth.js with the Tenant,
User, and role models, build the tenant-context isolation extension with its isolation tests, and
add tenant onboarding (branding and commodity setup). Then pause for review before M1.
