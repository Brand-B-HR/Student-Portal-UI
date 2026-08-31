"use client";

import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import ArticleCard from "@/components/ArticleCard";
import ArticleRail from "@/components/ArticleRail";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import AdBanner from "@/components/AdBanner";
import { ArticleCardSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { fetchArticles } from "@/lib/articles";
import { useAsync } from "@/hooks/useAsync";

export default function DashboardPage() {
  const { data, loading, error } = useAsync(
    (signal) => fetchArticles(1, 13, signal),
    []
  );
  const articles = data?.articles ?? [];

  // Slot the feed into the page's sections. The carousel and "Latest
  // articles" may overlap when there are only a few articles total —
  // that's preferable to leaving either section empty.
  const featuredSlides = articles.slice(0, 3);
  const rest = articles.length > featuredSlides.length ? articles.slice(featuredSlides.length) : articles;
  const latest = rest.slice(0, 6);
  const rail = rest.slice(6, 12);

  return (
    <SiteShell>
      {/* ── Masthead ─────────────────────────────────────────── */}
      <section className="border-b border-line bg-brand-100">
        <Container className="py-10 sm:py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="max-w-3xl font-serif text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] text-ink-900 sm:text-[46px]">
                Advice that gets you <em className="text-brand-600">hired</em>.
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-500 sm:text-base">
                Practical guidance from recruiters and hiring managers on CVs, interviews, and
                taking the first real step in your career.
              </p>
            </div>

            {/* CV prompt */}
            <div className="w-full max-w-sm flex-shrink-0 overflow-hidden rounded-[14px] border border-brand-200 bg-white p-5 lg:w-[320px]">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] bg-brand-500 text-white">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <h3 className="font-serif text-[19px] font-semibold leading-snug text-ink-900">
                  Keep your CV updated
                </h3>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                Upload a new version any time to replace the CV on your profile.
              </p>
              <Link
                href="/upload"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-600"
              >
                Update your CV
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[2.5]">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10 sm:py-14">
        {error ? (
          <ErrorState
            message="We couldn't load articles right now. Please try again in a moment."
            onRetry={() => window.location.reload()}
          />
        ) : loading ? (
          <div className="space-y-10">
            <div className="grid gap-6 md:grid-cols-2">
              <ArticleCardSkeleton />
              <ArticleCardSkeleton />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <ArticleCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : articles.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-current stroke-[1.5]">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="No articles yet"
            description="Our career team is writing the first guides now. Check back shortly."
          />
        ) : (
          <div className="space-y-14">

            {/* Featured */}
            <FeaturedCarousel articles={featuredSlides} />

            {/* Small ad strip — contained, never full-bleed */}
            <AdBanner variant="strip" />

            {/* Latest articles */}
            <section>
              <SectionHeader
                title="Latest articles"
                subtitle="Fresh guidance, published as our team writes it."
                actionLabel="View all"
                actionHref="/blog"
              />

              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {latest.map((a) => (
                  <ArticleCard key={a.id} article={a} variant="standard" />
                ))}
              </div>

              <div className="mt-8 sm:hidden">
                <Link
                  href="/blog"
                  className="flex items-center justify-center rounded-full border border-line-strong bg-white px-5 py-3 text-sm font-semibold text-ink-800"
                >
                  View all articles
                </Link>
              </div>
            </section>

            {/* Small ad strip — contained, never full-bleed */}
            <AdBanner variant="strip" />

            {/* Tinted rail band */}
            {rail.length > 0 && (
              <ArticleRail
                title="More from the library"
                subtitle="Deeper reads on interviews, salary, and growing your career."
                articles={rail}
                actionHref="/blog"
                actionLabel="More"
                tinted
              />
            )}
          </div>
        )}
      </Container>
    </SiteShell>
  );
}
