/**
 * Article categories + "premium" flag — UI-only placeholders.
 *
 * `BlogArticle` on the backend has no taxonomy or premium column today, so
 * there is no real data to filter or flag by. Rather than invent random
 * labels on every render (which would make tabs' contents shuffle on
 * refresh), we derive a stable pick per article from its id. Swap this out
 * for real fields the moment the backend adds them — every caller already
 * goes through `categoryOf` / `isPremium`, so that'll be a one-file change.
 */

import type { Article } from "@/lib/articles";

export const CATEGORIES = [
  "Salary",
  "Resume",
  "Interview Prep",
  "Career Change",
  "Leadership",
  "Personal Brand",
] as const;

export type Category = (typeof CATEGORIES)[number];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function categoryOf(article: Article): Category {
  return CATEGORIES[hashString(article.id) % CATEGORIES.length];
}

/** Roughly 1 in 4 articles, deterministically. */
export function isPremium(article: Article): boolean {
  return hashString(article.id) % 4 === 0;
}
