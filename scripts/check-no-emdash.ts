// Fails the build if an em dash appears anywhere in the source or copy.
// House rule: use commas, periods, parentheses, or colons instead.
// The reference documents (commodity_trading.md is the original brief) are not scanned.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = process.cwd();
const EM_DASH = String.fromCharCode(0x2014);
const SCAN_DIRS = ["app", "components", "lib", "prisma", "scripts"];
const SCAN_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".mjs"]);
const SKIP = new Set(["node_modules", ".next", ".git", "dist", "build"]);

type Hit = { file: string; line: number; text: string };

function walk(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else if (SCAN_EXTS.has(extname(entry))) out.push(full);
  }
}

const files: string[] = [];
for (const d of SCAN_DIRS) {
  try {
    walk(join(ROOT, d), files);
  } catch {
    // Directory may not exist yet. That is fine.
  }
}

const hits: Hit[] = [];
for (const file of files) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((text, i) => {
    if (text.includes(EM_DASH)) {
      hits.push({ file: file.replace(ROOT + "/", ""), line: i + 1, text: text.trim() });
    }
  });
}

if (hits.length > 0) {
  console.error(`Found ${hits.length} em dash(es). Replace them with commas, periods, parentheses, or colons.`);
  for (const h of hits) {
    console.error(`  ${h.file}:${h.line}  ${h.text}`);
  }
  process.exit(1);
}

console.log(`No em dashes found across ${files.length} files.`);
