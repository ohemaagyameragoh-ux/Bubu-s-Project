import type { PricePointView, ForecastPoint } from "@/lib/services/pricing";

// A small dependency-free SVG chart: the historic price line plus the AI forecast range band.
export function PriceChart({
  history,
  forecast,
}: {
  history: PricePointView[];
  forecast: ForecastPoint[];
}) {
  const W = 720;
  const H = 280;
  const P = 36;

  if (history.length < 2) {
    return <div className="rounded-2xl border border-line bg-card p-10 text-center text-muted shadow-card">Not enough price history yet. Record a few trades or add price points.</div>;
  }

  const histVals = history.map((h) => h.price);
  const allHigh = Math.max(...histVals, ...forecast.map((f) => f.high));
  const yMax = allHigh * 1.1 || 1;
  const total = history.length + forecast.length;
  const xAt = (i: number) => P + (i * (W - 2 * P)) / Math.max(1, total - 1);
  const yAt = (v: number) => H - P - (v / yMax) * (H - 2 * P);

  const histLine = history.map((h, i) => `${xAt(i)},${yAt(h.price)}`).join(" ");

  // The band starts at the last history point so the forecast connects to the line.
  const anchorIndex = history.length - 1;
  const bandTop = [`${xAt(anchorIndex)},${yAt(history[anchorIndex].price)}`, ...forecast.map((f, i) => `${xAt(history.length + i)},${yAt(f.high)}`)];
  const bandBottom = [...forecast.map((f, i) => `${xAt(history.length + i)},${yAt(f.low)}`).reverse(), `${xAt(anchorIndex)},${yAt(history[anchorIndex].price)}`];
  const bandPoints = [...bandTop, ...bandBottom].join(" ");
  const midLine = [`${xAt(anchorIndex)},${yAt(history[anchorIndex].price)}`, ...forecast.map((f, i) => `${xAt(history.length + i)},${yAt(f.mid)}`)].join(" ");

  const gridY = [0, 0.25, 0.5, 0.75, 1].map((t) => ({ y: yAt(yMax * t), label: Math.round(yMax * t) }));

  return (
    <div className="rounded-2xl border border-line bg-card p-4 shadow-card">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Price history and forecast">
        {gridY.map((g) => (
          <g key={g.y}>
            <line x1={P} x2={W - P} y1={g.y} y2={g.y} stroke="#e8e0d2" strokeWidth={1} strokeDasharray="3 4" />
            <text x={4} y={g.y + 4} fontSize={10} fill="#8c8475">
              {g.label >= 1000 ? `${Math.round(g.label / 1000)}k` : g.label}
            </text>
          </g>
        ))}
        {forecast.length > 0 ? <polygon points={bandPoints} fill="#bf6240" fillOpacity={0.12} /> : null}
        <polyline points={histLine} fill="none" stroke="#a5512f" strokeWidth={2.5} />
        {forecast.length > 0 ? (
          <polyline points={midLine} fill="none" stroke="#bf6240" strokeWidth={2} strokeDasharray="5 4" />
        ) : null}
      </svg>
      <div className="mt-2 flex items-center gap-5 px-2 text-xs text-muted">
        <span className="flex items-center gap-2">
          <span className="inline-block h-0.5 w-5 bg-clay-dark" /> Historic price
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-5 rounded-sm bg-clay/20" /> AI forecast range
        </span>
      </div>
    </div>
  );
}
