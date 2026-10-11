"use client";

import PublicShell from "@/components/PublicShell";
import Container from "@/components/ui/Container";
import ArticleCard from "@/components/ArticleCard";
import AdBanner from "@/components/AdBanner";
import Badge from "@/components/ui/Badge";
import { ArticleCardSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { fetchArticles } from "@/lib/articles";
import { categoryOf, isPremium } from "@/lib/categories";
import { useAsync } from "@/hooks/useAsync";

const PAGE_SIZE = 24;

export default function BlogPage() {
  // One larger page fetched up front — the API has no server-side category
  // column, so paging against a filtered subset isn't possible anyway.
  const { data, loading, error } = useAsync((signal) => fetchArticles(1, PAGE_SIZE, signal), []);
  const articles = data?.articles ?? [];

  return (
    <PublicShell>
      {/* Masthead */}
      <section className="border-b border-line bg-brand-100">
        <Container className="py-6 sm:py-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
            Articles &amp; guides
          </p>
          <h1 className="mt-1.5 font-serif text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-900 sm:text-[40px]">
            Career intelligence, written by the best.
          </h1>
        </Container>
      </section>

      <Container className="py-10 sm:py-12">
        <div>
          {error ? (
            <ErrorState
              message="Could not load articles. Please try again later."
              onRetry={() => window.location.reload()}
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
                  <div key={a.id} className="relative">
                    <div className="pointer-events-none absolute left-3.5 top-3.5 z-10 flex gap-1.5">
                      <Badge tone="outline" className="bg-white/90">
                        {categoryOf(a)}
                      </Badge>
                      {isPremium(a) && <Badge tone="solid">Premium</Badge>}
                    </div>
                    <ArticleCard article={a} variant="standard" priority={i < 3} />
                  </div>
                ))}
              </div>

              <AdBanner variant="strip" className="mt-12" />
            </>
          )}
        </div>
      </Container>
    </PublicShell>
  );
}
