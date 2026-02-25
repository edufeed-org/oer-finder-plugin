/**
 * Normalize Lit's dynamic comment IDs for stable snapshots.
 * Lit inserts comments like `<!--?lit$12345$-->` which change between renders.
 */
export function normalizeLitHTML(html: string): string {
  return html.replace(/<!--\?lit\$\d+\$-->/g, '<!--?lit$NORMALIZED$-->');
}
