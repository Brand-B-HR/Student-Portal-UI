"use client";

import { useEffect, useState } from "react";
import SiteShell from "@/components/SiteShell";
import Container from "@/components/ui/Container";
import ArticleCard from "@/components/ArticleCard";
import AdBanner from "@/components/AdBanner";
import { ArticleCardSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { fetchArticles, type Article } from "@/lib/articles";

const PAGE_SIZE = 9;

export default function BlogPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(false);
      try {
        const data = await fetchArticles(page, PAGE_SIZE, ctrl.signal);
        if (!cancelled) {
          setArticles(data.articles);
          setTotal(data.total);
        }
      } catch (e) {
        if (!cancelled && (e as Error).name !== "AbortError") setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function goTo(next: number) {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <SiteShell>
      {/* Masthead */}
      <section className="border-b border-line bg-white">
        <Container className="py-10 sm:py-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
            Every story
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-serif text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-900 sm:text-[40px]">
              All articles
            </h1>
            {!loading && !error && total > 0 && (
              <p className="pb-1.5 text-sm text-ink-400">
                {total} {total === 1 ? "article" : "articles"}
              </p>
            )}
          </div>
        </Container>
      </section>

      <Container className="py-10 sm:py-12">
        {error ? (
          <ErrorState
            message="Could not load articles. Please try again later."
            onRetry={() => goTo(page)}
          />
        ) : loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-current stroke-[1.5]">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="No articles yet"
            description="Check back soon — our career team is working on new guides for you."
          />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a, i) => (
                <ArticleCard key={a.id} article={a} variant="standard" priority={i < 3} />
              ))}
            </div>

            {/* Small ad strip below the grid */}
            <AdBanner variant="strip" className="mt-12" />

            {totalPages > 1 && (
              <nav
                aria-label="Pagination"
                className="mt-12 flex items-center justify-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => goTo(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="flex h-10 items-center gap-1.5 rounded-full border border-line-strong bg-white px-4 text-sm font-semibold text-ink-700 transition disabled:opacity-35 enabled:hover:border-brand-500 enabled:hover:text-brand-700"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2.5]">
                    <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Prev
                </button>

                <span className="px-3 text-sm text-ink-500">
                  Page <span className="font-semibold text-ink-900">{page}</span> of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => goTo(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="flex h-10 items-center gap-1.5 rounded-full border border-line-strong bg-white px-4 text-sm font-semibold text-ink-700 transition disabled:opacity-35 enabled:hover:border-brand-500 enabled:hover:text-brand-700"
                >
                  Next
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2.5]">
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </nav>
            )}
          </>
        )}
      </Container>
    </SiteShell>
  );
}
