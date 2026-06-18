// Tiny class-name joiner. Falsy values are dropped so conditional classes stay readable.
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
