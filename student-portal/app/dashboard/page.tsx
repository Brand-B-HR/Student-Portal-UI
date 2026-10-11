"use client";

import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import ArticleCard from "@/components/ArticleCard";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import AdBanner from "@/components/AdBanner";
import { ArticleCardSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { fetchArticles, sortByRecency } from "@/lib/articles";
import { useAsync } from "@/hooks/useAsync";

/** How many cards the "Latest articles" grid shows. */
const LATEST_COUNT = 3;

/** Masthead shortcuts into the three things a student can actually do here. */
const QUICK_LINKS = [
  {
    label: "Read all articles",
    href: "/blog",
    icon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
  },
  {
    label: "Apply for job openings",
    href: "/jobs",
    icon: "M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M4 7h16v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7z",
  },
  {
    label: "Get consultation",
    href: "/our-team",
    icon: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
  },
];

export default function DashboardPage() {
  const { data, loading, error } = useAsync(
    (signal) => fetchArticles(1, 13, signal),
    []
  );
  // Sorted here rather than trusting the endpoint's row order, so "Latest
  // articles" is actually the latest whatever the API hands back.
  const articles = sortByRecency(data?.articles ?? []);

  // Slot the feed into the page's sections. "Latest articles" shows the three
  // most recent in the system, so it deliberately repeats the carousel above
  // it — change this to articles.slice(3, 6) if the two should never overlap.
  const featuredSlides = articles.slice(0, 3);
  const latest = articles.slice(0, LATEST_COUNT);

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

            {/* Quick links into the features, in place of the old CV prompt —
                there's no CV captured at sign-up, so prompting to "update"
                one asked students to replace something they never uploaded. */}
            <div className="w-full max-w-sm flex-shrink-0 overflow-hidden rounded-[14px] border border-brand-200 bg-white p-5 lg:w-[320px]">
              <h3 className="font-serif text-[19px] font-semibold leading-snug text-ink-900">
                Start here
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                Jump straight to what you came for.
              </p>

              <ul className="mt-4 space-y-1">
                {QUICK_LINKS.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="group flex items-center gap-3 rounded-[10px] px-2 py-2 text-sm font-medium text-ink-900 transition-colors hover:bg-brand-100"
                    >
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-brand-500 text-white">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2]">
                          <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="flex-1 text-left">{item.label}</span>
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden
                        className="h-3.5 w-3.5 flex-shrink-0 fill-none stroke-current stroke-[2.5] text-ink-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600"
                      >
                        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
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

          </div>
        )}
      </Container>
    </SiteShell>
  );
}
