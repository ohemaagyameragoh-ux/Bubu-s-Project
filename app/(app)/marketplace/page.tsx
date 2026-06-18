import Link from "next/link";
import { ListingType } from "@prisma/client";
import { getSessionUser } from "@/lib/session";
import { listBoard, myListings } from "@/lib/services/marketplace";
import { listCommodities } from "@/lib/services/commodities";
import { formatMoney, formatQuantity } from "@/lib/format";
import { commodityIcon } from "@/lib/commodity-icon";
import { Card, Badge, PageHeader } from "@/components/ui";
import { PostListingForm } from "@/components/marketplace/PostListingForm";
import { makeOfferAction, acceptOfferAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MarketplacePage({ searchParams }: { searchParams: { tab?: string } }) {
  const tab = searchParams.tab === "sell" ? ListingType.SELL : ListingType.BUY;
  const [user, board, mine, commodities] = await Promise.all([
    getSessionUser(),
    listBoard(tab),
    myListings(),
    listCommodities(),
  ]);
  const myTenantId = user?.tenantId;

  return (
    <div>
      <PageHeader title="Marketplace" subtitle="Buy requests and sell offers from traders across the network." />
      <PostListingForm commodityNames={commodities.map((c) => c.name)} />

      <div className="mb-6 flex items-center gap-6 border-b border-line">
        {[
          { key: "buy", label: "Buy requests" },
          { key: "sell", label: "Sell offers" },
        ].map((t) => {
          const active = (t.key === "sell" ? ListingType.SELL : ListingType.BUY) === tab;
          return (
            <Link
              key={t.key}
              href={`/marketplace?tab=${t.key}`}
              className={
                "no-underline -mb-px border-b-2 px-1 pb-3 text-sm font-medium " +
                (active ? "border-clay text-ink" : "border-transparent text-muted hover:text-ink")
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <div className="mb-10 grid gap-4 md:grid-cols-2">
        {board.length === 0 ? (
          <Card>
            <p className="text-muted">Nothing posted here yet.</p>
          </Card>
        ) : (
          board.map((l) => {
            const isMine = l.tenantId === myTenantId;
            const offerVerb = l.type === ListingType.SELL ? "Offer to buy" : "Offer to sell";
            return (
              <Card key={l.id} className="p-5">
                <div className="flex items-center gap-2">
                  <span aria-hidden>{commodityIcon(l.commodityName)}</span>
                  <span className="font-medium text-ink">{l.commodityName}</span>
                  {l.grade ? <Badge>{l.grade}</Badge> : null}
                </div>
                <div className="mt-2 font-display text-2xl font-semibold text-ink">
                  {formatMoney(l.price)} <span className="text-sm text-muted">/{l.unit}</span>
                </div>
                <div className="mt-1 text-sm text-muted">
                  {formatQuantity(l.quantity, l.unit)} {l.type === ListingType.BUY ? "requested" : "available"}
                  {l.region ? ` · ${l.region}` : ""}
                </div>
                <div className="mt-1 text-sm text-muted">By {l.ownerName} {isMine ? "(you)" : ""}</div>
                {l.note ? <div className="mt-2 text-sm text-ink">{l.note}</div> : null}

                {isMine ? (
                  <div className="mt-4 text-xs text-muted">Your listing. Offers appear in My listings below.</div>
                ) : (
                  <form action={makeOfferAction} className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
                    <input type="hidden" name="listingId" value={l.id} />
                    <div>
                      <label className="label-caps mb-1 block">Your price</label>
                      <input name="price" type="number" step="any" min="0" defaultValue={l.price} className="w-28 rounded-lg border border-line px-2 py-1 text-sm" />
                    </div>
                    <div>
                      <label className="label-caps mb-1 block">Quantity</label>
                      <input name="quantity" type="number" step="any" min="0" defaultValue={l.quantity} className="w-24 rounded-lg border border-line px-2 py-1 text-sm" />
                    </div>
                    <input name="message" placeholder="Message" className="flex-1 rounded-lg border border-line px-2 py-1 text-sm" />
                    <button className="rounded-xl bg-clay px-3 py-2 text-sm font-medium text-white hover:bg-clay-dark">
                      {offerVerb}
                    </button>
                  </form>
                )}
              </Card>
            );
          })
        )}
      </div>

      <h2 className="mb-3 text-sm font-medium text-ink">My listings and offers received</h2>
      {mine.length === 0 ? (
        <Card>
          <p className="text-muted">You have not posted any listings yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {mine.map((l) => (
            <Card key={l.id} className="p-5">
              <div className="flex items-center justify-between">
                <div className="font-medium text-ink">
                  {l.type === ListingType.SELL ? "Selling" : "Buying"} {l.commodityName} · {formatQuantity(l.quantity, l.unit)} · {formatMoney(l.price)}/{l.unit}
                </div>
                <Badge tone={l.status === "OPEN" ? "peach" : "green"}>{l.status.toLowerCase()}</Badge>
              </div>
              <div className="mt-3 space-y-2">
                {l.offers.length === 0 ? (
                  <div className="text-sm text-muted">No offers yet.</div>
                ) : (
                  l.offers.map((o) => (
                    <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line p-3 text-sm">
                      <div className="text-ink">
                        {o.fromName} offered {formatMoney(o.price)}/{l.unit} for {formatQuantity(o.quantity, l.unit)}
                        {o.message ? <span className="text-muted"> · {o.message}</span> : null}
                      </div>
                      {o.status === "PENDING" && l.status === "OPEN" ? (
                        <form action={acceptOfferAction}>
                          <input type="hidden" name="offerId" value={o.id} />
                          <button className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-forest-dark hover:border-forest/40">
                            Accept
                          </button>
                        </form>
                      ) : (
                        <Badge tone={o.status === "ACCEPTED" ? "green" : "neutral"}>{o.status.toLowerCase()}</Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
