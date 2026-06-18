// Turn a workspace name into a URL-safe slug. No em dashes are produced: spaces and runs of
// non-alphanumeric characters collapse to single hyphens, which are normal slug separators.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "workspace";
}
