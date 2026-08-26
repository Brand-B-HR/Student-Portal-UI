/** Shared article types + helpers. Previously duplicated across dashboard/blog pages. */

export interface Article {
  id: string;
  title: string;
  contentHtml: string;
  coverImageUrl?: string;
  imageUrls?: string[];
  authorName?: string;
  createdAt: string;
  publishedAt?: string;
}

export interface ArticleListResponse {
  articles: Article[];
  total: number;
}

const API = process.env.NEXT_PUBLIC_API_URL;

/**
 * Cleans up rich HTML coming out of the admin portal's Quill editor.
 *
 * Text pasted from Word/Google Docs arrives with a non-breaking space between
 * *every word*. `&nbsp;` never wraps, so the browser treats a whole paragraph as
 * one unbreakable token and it runs off the side of the page. Collapsing them to
 * ordinary spaces restores normal wrapping.
 *
 * Also drops the empty heading/paragraph shells Quill leaves behind when a line is
 * deleted — `<p><br></p>` is kept, since that's a deliberate blank line.
 */
export function normalizeArticleHtml(html: string): string {
  return html
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .replace(/<(h[1-6]|p)>\s*<\/\1>/gi, "");
}

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function excerpt(html: string, max = 180): string {
  const text = stripHtml(html);
  if (text.length <= max) return text;
  return text.slice(0, text.lastIndexOf(" ", max)).trimEnd() + "…";
}

export function formatDate(dateStr?: string, long = false): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: long ? "long" : "short",
    day: "numeric",
  });
}

export function readMinutes(html: string): number {
  const words = stripHtml(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function readTime(html: string): string {
  return `${readMinutes(html)} min read`;
}

export function authorOf(article: Article): string {
  return article.authorName?.trim() || "CareerBuild";
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** Fetch a page of published articles. Returns empty on failure — callers render an empty state. */
export async function fetchArticles(
  page = 1,
  pageSize = 9,
  signal?: AbortSignal
): Promise<ArticleListResponse> {
  const res = await fetch(
    `${API}/api/blog/articles?page=${page}&pageSize=${pageSize}`,
    { signal }
  );
  if (!res.ok) throw new Error("Failed to load articles");
  const data = await res.json();
  return { articles: data.articles ?? [], total: data.total ?? 0 };
}

export async function fetchArticle(id: string, signal?: AbortSignal): Promise<Article> {
  const res = await fetch(`${API}/api/blog/articles/${id}`, { signal });
  if (res.status === 404) throw new Error("not_found");
  if (!res.ok) throw new Error("failed");
  return res.json();
}
