Commodity Trading SaaS: Build Brief

A build brief for an agentic builder (Claude Cowork). Build in the phase order in Section 9. Phase 1 is the minimum viable product. Everything after Phase 1 is additive and must not break the core. Hard convention: never use em dashes anywhere, including UI copy, generated documents, and code comments. Use commas, colons, parentheses, or periods.


1. Product summary

A multi-tenant SaaS platform that commodity traders sign on to. Each trader gets an isolated workspace to record and track trades, run an aggregation operation (sourcing from farmers to fill client orders), manage logistics, generate documents, and understand their finances. On top of that core, two optional revenue modules let the platform broker trades between traders and match freight, earning margin and commission for the platform operator.

The platform operator is the company running the SaaS (for example 40 Analytics). Tenants are the traders who sign up. End users are the staff inside each tenant (sales, procurement, field agents, logistics, finance).


2. Business model and monetization

The platform is free to sign up and free for a trader to record and track their own trades. Platform revenue comes from three levers:


Brokered margin: when the platform matches a buy and a sell between two traders and itself sits in the middle (the two-leg flow in Section 6.5), it keeps the spread.
Freight commission: when haulage is matched through the hauling module, a configurable fee is deducted from the transporter payout (or optionally charged to the requester).
Optional subscription tiers: premium features (advanced forecasting, higher limits, white-label branding) can be gated behind paid plans. See open decision D1.


Platform revenue is recorded on an internal operations ledger that is completely separate from any tenant's own books. Tenants never see platform margin or commission as part of their own reports.


3. Architecture and recommended stack

These are the recommended defaults. They are chosen for build speed and for fit with the operator's existing GCP and Python footprint. Adjust only with reason.


Backend: Python with Django and Django REST Framework. Django is chosen because its built-in admin gives the platform super-admin a head start, and its auth and migrations suit multi-tenancy.
Database: PostgreSQL on Cloud SQL. Add the PostGIS extension only if farmer plot polygons are in scope (see open decision D4).
Multi-tenancy: shared database with a mandatory tenant_id on every tenant-owned row, enforced by a tenant-scoping middleware and a base queryset manager so no query can ever leak across tenants. Schema-per-tenant is the stronger-isolation alternative (open decision D2).
Frontend: React single-page app for the main web experience.
Field capture: a Progressive Web App with offline-first sync for agents buying from farmers in low-connectivity areas. Native apps are a later upgrade, not part of MVP.
Background jobs: Celery with Redis for statement parsing, forecasting, marketplace matching, and outbound email and WhatsApp.
Document generation: server-side PDF rendering (WeasyPrint or ReportLab) for quotes, delivery reports, and invoices.
Hosting: GCP Cloud Run for services, Cloud SQL for the database, Cloud Storage for generated documents and uploaded statements.
AI: the Anthropic API (Claude) for bank and mobile money statement parsing and categorization. Time-series forecasting via a dedicated library (Prophet or statsmodels) with optional LLM assistance.



4. Tenancy, users, and roles

Every tenant-owned record carries a tenant_id. Cross-tenant reads and writes are impossible by construction.

User roles inside a tenant:


Tenant Admin: configures the workspace, manages users, connects integrations.
Sales or Administrator: owns leads, quotes, the pipeline, and client communication.
Procurement Officer and Field Agent: source from farmers and manage buying.
Logistics Manager: owns dispatch through delivery.
Finance Officer: owns settlement, the ledger, and the statement analyzer.


Trader classification, set per transaction, not per user:


Owner-Trader: holds title and stock, carries price risk, reports profit and loss. Requires a capital source field.
Broker: facilitates a deal without taking title, earns a commission, reports commission income separately. Requires a commission field.


A single user can act as both and chooses the role on each transaction. The chosen role changes which fields are required and which report bucket the result lands in.

Platform-level roles (outside any tenant):


Super Admin: oversees all tenants, manages plans and billing, and owns the internal operations ledger.



5. Core module: transactions and dashboard (Phase 1, the MVP)

This is the heart of the platform and the first thing to ship.

Transaction record fields: tenant, role (owner-trader or broker), commodity, quantity, unit, grade, buy price and sell price (owner) or commission (broker), counterparty, capital source (owner only), payment status, delivery status, dates, and free notes.

Derived lifecycle: Active, Pending, Completed, Cancelled. Status is derived from payment and delivery state, with quick manual override.

Dashboard: a filterable list of transactions (by commodity, time period, role, counterparty, status) with inline quick status updates.

Reports: profit and loss for owner trades, commission income for broker trades (kept in separate buckets), plus aggregations by commodity, time period, role, and counterparty. Exportable.

Acceptance for Phase 1: a trader can sign up, configure their commodities, record a transaction in either role, see it on the dashboard, move it through its lifecycle, and pull a P&L and a commission report.


6. Operational and revenue modules

6.1 CRM and sales pipeline

Leads captured from inbound requests, including WhatsApp, logged against a client record. Pipeline stages: Lead, Quote Sent, Negotiating, Closed (with Pending and Lost). A closed deal converts into a confirmed order that drives sourcing and fulfillment. The pipeline view doubles as a sales forecast.

6.2 Quotes and documents

Quote builder with line items, pricing, delivery terms, and validity. Every quote generates a branded document that can be downloaded as a file and emailed to the client from inside the system. The same document engine produces delivery reports (Section 6.4) and invoices (Section 6.6). Email sending is per tenant, using the tenant's own connected sender. Documents carry the tenant's branding, not the operator's.

6.3 Inventory and aggregation from farmers

On a confirmed order, the system shows required quantity, quantity on hand, and the gap to source. Inventory is always the running total of lots bought minus lots dispatched, viewable by commodity, grade, location, and lot age, at any moment.

Aggregation: field agents record the farmer, weigh the produce, grade it (moisture, foreign matter), apply deductions, set the price, and pay by mobile money with a receipt. Each purchase creates a tracked lot tagged with farmer, origin, grade, net weight, and cost. Lots are consolidated and quality-checked at the warehouse until the order quantity at the right grade is reached.

6.4 Logistics and hauling

Two faces of the same module, both syncing status back to the linked transaction's delivery status.

Self-managed dispatch (owner-trader fulfilling an order):


Assign the order to a trip, select truck and driver, capture transporter and freight rate.
Pick the lots to load (oldest first for traceability).
Record weighbridge in and out, bag count, total weight, and lot numbers.
Apply and record a seal number, then generate a waybill.
Track status (Loading, In Transit, Delivered), departure, ETA, and any delay.
On arrival, record received weight, confirm seal intact, capture the client goods received note, and compute the dispatched-versus-received variance.
Record actual freight and trip expenses to close the trip cost.


Hauling marketplace (matching third-party transporters):


Create a haulage request, standalone or linked to a transaction, with pickup and drop-off, commodity, tonnage, date, and vehicle type.
Transporters quote; the requester books directly.
Status tracking from Requested to Delivered.
Commission engine deducts a configurable fee from the transporter payout, or optionally charges the requester. This commission posts to the platform's internal operations ledger.


6.5 Marketplace (trader to trader)

Note: this is a marketplace between traders, not between the platform and farmers. Aggregation from farmers (Section 6.3) remains the sourcing path.


Buy Requests and Sell Offers on a searchable board, with automated matching by commodity, grade, region, and price.
A negotiation and acceptance workflow. On agreement, a transaction record is auto-generated for the parties.
A special two-leg flow when the platform itself is the counterparty: the platform buys from the seller and sells to the buyer as two linked legs, keeping the spread as brokered margin, recorded on the internal operations ledger.
Trust features: counterparty verification, ratings, and dispute flagging.


6.6 Finance, statement analyzer, and pricing

Self-populating ledger: farmer purchases post as cost of goods, client receipts as revenue, freight and commissions as direct costs, and overheads as operating expenses. This gives margin per order, per commodity, and per client, plus live receivables and payables, with no manual bookkeeping.

Invoicing: raise an invoice for the accepted quantity at the agreed price, email it to the client, and mark it paid on receipt. Handle partials and credit terms.

Statement analyzer: upload bank and mobile money statements (PDF or CSV). The system parses and auto-categorizes each line, then reconciles against what the system recorded (farmer payouts, client receipts, freight). It flags mismatches, which is where leakage hides in aggregation businesses.

Pricing and AI: a historic price database per commodity and region, fed by aggregated tenant transactions, external feeds, or admin entry. A forecasting feature shows price ranges with confidence indicators and mandatory disclaimers, on charts that overlay the forecast and the user's own trades on the historic trend. Forecasting also covers tenant cash flow, since paying farmers now and being paid by clients later creates a predictable working-capital squeeze.

6.7 Platform administration

Super-admin oversight of all tenants, plan and subscription management, and the internal operations ledger that records brokered margin and freight commission. This ledger is strictly separate from tenant-facing reports.


7. Data model

Core entities and their key relationships. Every tenant-owned entity carries tenant_id.


Tenant: name, branding, plan, integration credentials. Owns everything below.
User: belongs to one tenant, holds one or more roles. Super admins sit outside tenants.
Commodity: per tenant, with grades, units, and quality parameters.
Counterparty: clients and suppliers. Farmer is a supplier subtype, with optional plot or GPS data. Carries ratings.
Lead and Deal (CRM): client, commodity, quantity, grade, location, deadline, stage, source.
Quote: linked to a deal, with line items, validity, status, and a document reference.
Transaction (core): tenant, role, commodity, quantity, pricing or commission, counterparty, capital source, payment and delivery status, lifecycle, optional links to a deal and a trip.
InventoryLot: commodity, grade, quantity, origin farmer, cost, location, status, with movement history.
Purchase: farmer, weight, grade, deductions, price, mobile money payment. Creates a lot.
Trip or Dispatch: order, truck, driver, transporter, freight, weighbridge in and out, bags, lots, seal number, waybill, status, times, goods received note, variance, delivery report reference.
HaulingRequest: standalone or transaction-linked, with pickup, drop-off, commodity, tonnage, date, vehicle type, status.
Transporter: profile, vehicles, ratings.
HaulingQuote: transporter, request, price, booking, commission.
MarketplaceListing: buy request or sell offer, with commodity, quantity, price, region, status.
MarketplaceDeal: matched listings, negotiation, acceptance, generated transactions, optional two-leg platform flow.
PriceHistory: commodity, region, date, price, source.
PriceForecast: commodity, region, horizon, range, confidence.
Invoice: deal or transaction, client, amount, status, document reference.
Payment: linked to an invoice or a purchase, with direction, method, amount, date, reconciliation status.
LedgerEntry: tenant books, typed (cost of goods, revenue, freight, commission, operating expense).
PlatformLedgerEntry: internal operator ledger for brokered margin and freight commission, separate from tenant reports.
BankStatement and StatementLine: uploaded, parsed, categorized, matched.
Document: type (quote, delivery report, invoice, waybill), references, file, sent status.
AuditLog: who did what and when, per tenant.



8. Integrations

All integrations are configured per tenant, using each tenant's own accounts.


WhatsApp Business Cloud API: inbound requests become leads, outbound for quotes, delivery updates, and payment reminders.
Transactional email: per-tenant sender for quotes, delivery reports, and invoices.
Mobile money (MTN MoMo and others) and a bank feed: for farmer payouts, client receipts, and the statement analyzer.
External price feeds: optional, for the historic price database.



9. Build sequence

Build in this order. Each phase must leave the platform shippable.


Phase 0, Foundation: multi-tenant scaffolding, auth, roles, tenant configuration, commodity setup.
Phase 1, Core MVP: transaction recording, dashboard, lifecycle, P&L and commission reports (Section 5).
Phase 2, Owner-trader operations: CRM and pipeline, quotes with download and email, inventory and aggregation from farmers, invoicing.
Phase 3, Logistics: self-managed dispatch with weighbridge, seal, waybill, goods received note, and delivery report generation and sending.
Phase 4, Finance depth: self-populating ledger, statement analyzer, plus price history and AI forecasting.
Phase 5, Marketplace: trader-to-trader listings, matching, negotiation, the two-leg platform flow, ratings and disputes, and brokered margin on the internal ledger.
Phase 6, Hauling marketplace: transporter quoting and booking with the commission engine.
Phase 7, Platform administration: super-admin, internal operations ledger, and subscription billing.


Rationale: ship the core trade tracker first so traders get value immediately, layer the operational depth that an aggregation business needs, then turn on the revenue modules once there are tenants and liquidity to broker.


10. Conventions and constraints


No em dashes anywhere, including UI copy, generated documents, and code comments.
Per-tenant branding on all generated documents. The platform's own default theme can use the operator palette (navy and gold) but tenants override it.
Every tenant-owned query is tenant-scoped by default. Treat any cross-tenant access as a bug.
Mobile money and statements involve money movement: log an audit trail and never auto-execute a payout or a payment without an explicit user action.
Forecasts always carry a visible disclaimer and a confidence indicator.



11. Open decisions to confirm before building


D1, Monetization mix: free with margin and commission only, or also paid subscription tiers. Default assumed: free core, with margin and commission, subscriptions optional later.
D2, Isolation model: shared database with tenant_id (faster to build) or schema-per-tenant (stronger isolation). Default assumed: shared database with tenant_id.
D3, Starting commodity for pilot data and grading defaults, or fully commodity-agnostic from day one. Default assumed: agnostic, with the operator's own tenant seeded first.
D4, Farmer plot mapping and GPS or polygon capture for export compliance: in scope now or later. Default assumed: later, behind a feature flag.
D5, Field capture: Progressive Web App for MVP (assumed) or native app sooner.

