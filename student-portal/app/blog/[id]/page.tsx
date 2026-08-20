"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import Container from "@/components/ui/Container";
import ArticleCard from "@/components/ArticleCard";
import AdBanner from "@/components/AdBanner";
import CommentSection from "@/components/CommentSection";
import { Spinner, EmptyState, ErrorState } from "@/components/ui/States";
import {
  fetchArticle,
  fetchArticles,
  formatDate,
  readTime,
  authorOf,
  initialsOf,
  normalizeArticleHtml,
  type Article,
} from "@/lib/articles";

export default function BlogArticlePage() {
  const params = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"" | "not_found" | "error">("");

  useEffect(() => {
    if (!params.id) return;
    const ctrl = new AbortController();
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchArticle(params.id, ctrl.signal);
        if (!cancelled) setArticle(data);
      } catch (e) {
        const msg = (e as Error).message;
        if (msg === "AbortError" || (e as Error).name === "AbortError") return;
        if (!cancelled) setError(msg === "not_found" ? "not_found" : "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [params.id]);

  // Related reads — everything else from the latest feed.
  useEffect(() => {
    if (!article) return;
    const ctrl = new AbortController();
    (async () => {
      try {
        const { articles } = await fetchArticles(1, 7, ctrl.signal);
        setRelated(articles.filter((a) => a.id !== article.id).slice(0, 3));
      } catch {
        /* related reads are optional */
      }
    })();
    return () => ctrl.abort();
  }, [article]);

  const author = article ? authorOf(article) : "";
  const published = article ? formatDate(article.publishedAt ?? article.createdAt, true) : "";

  return (
    <SiteShell>
      <Container size="narrow" className="py-8 sm:py-12">
        {/* Back */}
        <Link
          href="/blog"
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition-colors hover:text-brand-700"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2.5] transition-transform group-hover:-translate-x-0.5">
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          All articles
        </Link>

        {loading && <Spinner label="Loading article…" />}

        {!loading && error === "not_found" && (
          <div className="py-12">
            <EmptyState
              title="Article not found"
              description="This article may have been removed, or it isn't published yet."
              action={
                <Link
                  href="/blog"
                  className="inline-flex rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-600"
                >
                  Browse all articles
                </Link>
              }
            />
          </div>
        )}

        {!loading && error === "error" && (
          <div className="py-12">
            <ErrorState
              message="Failed to load this article. Please try again later."
              onRetry={() => window.location.reload()}
            />
          </div>
        )}

        {!loading && article && (
          <article className="mt-8">
            {/* Headline block */}
            <header>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
                Career advice
              </p>

              <h1 className="mt-3.5 font-serif text-[32px] font-semibold leading-[1.12] tracking-[-0.02em] text-ink-900 sm:text-[42px]">
                {article.title}
              </h1>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-y border-line py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {initialsOf(author)}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">{author}</p>
                  <p className="text-xs text-ink-400">
                    {published} &middot; {readTime(article.contentHtml)}
                  </p>
                </div>
              </div>
            </header>

            {/* Cover */}
            {article.coverImageUrl && (
              <figure className="mt-8">
                <img
                  src={article.coverImageUrl}
                  alt=""
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-[16/9] w-full rounded-[14px] object-cover"
                />
              </figure>
            )}

            {/* Body — styled by .blog-content in globals.css */}
            <div
              className="blog-content mt-10"
              dangerouslySetInnerHTML={{ __html: normalizeArticleHtml(article.contentHtml) }}
            />

            {/* Foot */}
            <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-600"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2.5]">
                  <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                All articles
              </Link>
              <p className="text-xs text-ink-400">Published {published}</p>
            </div>

            {/* Comments — front-end only for now */}
            <CommentSection articleId={article.id} />

            <AdBanner variant="strip" className="mt-12" />

            {/* Related */}
            {related.length > 0 && (
              <section className="mt-14">
                <h2 className="font-serif text-[22px] font-semibold text-ink-900">
                  More like this
                </h2>
                <div className="mt-5 divide-y divide-line border-y border-line">
                  {related.map((a) => (
                    <ArticleCard key={a.id} article={a} variant="list" />
                  ))}
                </div>
              </section>
            )}
          </article>
        )}
      </Container>
    </SiteShell>
  );
}
