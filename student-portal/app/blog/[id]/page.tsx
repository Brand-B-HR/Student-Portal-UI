"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PublicShell from "@/components/PublicShell";
import Container from "@/components/ui/Container";
import ArticleCard from "@/components/ArticleCard";
import AdBanner from "@/components/AdBanner";
import CommentSection from "@/components/CommentSection";
import { Spinner, EmptyState, ErrorState } from "@/components/ui/States";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import {
  fetchArticle,
  fetchArticles,
  formatDate,
  readTime,
  authorOf,
  initialsOf,
  stripHtml,
  sanitizeArticleHtml,
} from "@/lib/articles";
import { useAsync } from "@/hooks/useAsync";

/** Signed-out readers see this many characters of the article before the paywall. */
const TEASER_CHARS = 480;

export default function BlogArticlePage() {
  const params = useParams<{ id: string }>();
  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        setSignedIn(!!user);
        setAuthChecked(true);
      }),
    []
  );

  const {
    data: article,
    loading,
    error: fetchError,
  } = useAsync((signal) => fetchArticle(params.id, signal), [params.id]);
  const error = !fetchError ? "" : fetchError.message === "not_found" ? "not_found" : "error";

  // Related reads — everything else from the latest feed. Optional, so a
  // failure here is swallowed rather than surfaced as a page error.
  const { data: relatedData } = useAsync(
    async (signal) => {
      if (!article) return [];
      const { articles } = await fetchArticles(1, 7, signal);
      return articles.filter((a) => a.id !== article.id).slice(0, 3);
    },
    [article]
  );
  const related = relatedData ?? [];

  const author = article ? authorOf(article) : "";
  const published = article ? formatDate(article.publishedAt ?? article.createdAt, true) : "";

  const showLoading = loading || !authChecked;

  return (
    <PublicShell>
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

        {showLoading && <Spinner label="Loading article…" />}

        {!showLoading && error === "not_found" && (
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

        {!showLoading && error === "error" && (
          <div className="py-12">
            <ErrorState
              message="Failed to load this article. Please try again later."
              onRetry={() => window.location.reload()}
            />
          </div>
        )}

        {!showLoading && article && (
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
            {signedIn ? (
              <div
                className="blog-content mt-10"
                dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.contentHtml) }}
              />
            ) : (
              <div className="relative mt-10">
                <p className="blog-content line-clamp-[8]">
                  {stripHtml(article.contentHtml).slice(0, TEASER_CHARS)}…
                </p>
                {/* Fade the teaser into the paywall panel below it. */}
                <div className="pointer-events-none absolute inset-x-0 -bottom-1 h-32 bg-gradient-to-t from-surface-subtle to-transparent" />

                <div className="mt-6 rounded-[16px] border border-brand-200 bg-brand-100/60 px-6 py-8 text-center sm:px-10">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
                    Members only
                  </p>
                  <h3 className="mt-2 font-serif text-xl font-semibold text-ink-900 sm:text-2xl">
                    Sign in to keep reading
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-600">
                    Free membership unlocks this article and 600+ others, plus a CV review from
                    our expert panel.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/login?mode=signup"
                      className="inline-flex items-center rounded-full bg-brand-500 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-600"
                    >
                      Join free
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex items-center rounded-full border border-line-strong bg-white px-6 py-2.5 text-sm font-semibold text-ink-800 transition-colors hover:border-brand-500 hover:text-brand-700"
                    >
                      Sign in
                    </Link>
                  </div>
                </div>
              </div>
            )}

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

            {/* Comments — front-end only for now, and only worth showing to readers who saw the article */}
            {signedIn && <CommentSection key={article.id} articleId={article.id} />}

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
    </PublicShell>
  );
}
