// A small emoji glyph per commodity, matched loosely by name so any tenant's crops get an icon.
const MAP: { match: string[]; icon: string }[] = [
  { match: ["maize", "corn"], icon: "🌾" },
  { match: ["rice", "wheat", "sorghum", "millet"], icon: "🌾" },
  { match: ["soy", "soya", "bean"], icon: "🫘" },
  { match: ["cocoa", "coffee"], icon: "🫘" },
  { match: ["cashew", "groundnut", "peanut", "nut"], icon: "🥜" },
  { match: ["shea", "seed"], icon: "🌰" },
];

export function commodityIcon(name: string): string {
  const n = name.toLowerCase();
  for (const entry of MAP) {
    if (entry.match.some((m) => n.includes(m))) return entry.icon;
  }
  return "📦";
}
