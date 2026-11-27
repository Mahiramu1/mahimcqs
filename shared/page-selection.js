export const MAX_SELECTED_PAGES = 8;

export function parsePages(input, totalPages, limit = MAX_SELECTED_PAGES) {
  const pages = new Set();
  for (const part of input.trim().split(',')) {
    const range = /^([0-9]+)(?:\s*-\s*([0-9]+))?$/.exec(part.trim());
    if (!range) throw new Error('Enter page numbers or ranges, such as 1-3, 5.');
    const first = Number(range[1]);
    const last = Number(range[2] ?? range[1]);
    if (first < 1 || last < first || last > totalPages) {
      throw new Error(`Use ascending page ranges between 1 and ${totalPages}.`);
    }
    for (let page = first; page <= last; page++) {
      pages.add(page);
      if (pages.size > limit) throw new Error(`Select at most ${limit} pages per batch.`);
    }
  }
  return [...pages].sort((a, b) => a - b);
}
