"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PublicShell from "@/components/PublicShell";
import Container from "@/components/ui/Container";
import ArticleCard, { Cover } from "@/components/ArticleCard";
import AdBanner from "@/components/AdBanner";
import { Spinner, ErrorState } from "@/components/ui/States";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import { fetchArticles, authorOf, formatDate, readTime } from "@/lib/articles";
import { useAsync } from "@/hooks/useAsync";

const TICKER_ITEMS = [
  "Resume templates updated for 2026",
  "Salary negotiation workshop — this Friday",
  "500+ career guides available",
  "Free CV review for new members",
  "New: Senior PM Interview Mock",
];

const STATS = [
  { value: "42k", label: "Members" },
  { value: "600+", label: "Articles" },
  { value: "180+", label: "Companies covered" },
];

/**
 * Signed-out marketing homepage. Everyone can browse and read the first few
 * articles in full — going further (or opening one from the locked list)
 * asks for a free account. Signed-in visitors are sent straight to their
 * dashboard instead of seeing this page.
 */
export default function HomePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        if (user) {
          router.replace("/dashboard");
          setSignedIn(true);
        }
        setAuthChecked(true);
      }),
    [router]
  );

  const { data, loading, error } = useAsync((signal) => fetchArticles(1, 9, signal), []);
  const articles = data?.articles ?? [];

  // First few are open teaser cards; the rest render as a locked "sign in to
  // read" list, matching the free/members-only split the design calls for.
  const openArticles = articles.slice(0, 5);
  const lockedArticles = articles.slice(5, 9);

  if (!authChecked || signedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-subtle">
        <Spinner />
      </div>
    );
  }

  return (
    <PublicShell>
      {/* ── Announcement ticker ─────────────────────────────────── */}
      <div className="overflow-hidden border-b border-brand-600 bg-brand-500 py-2 text-white">
        <div className="animate-marquee flex w-max gap-16 whitespace-nowrap text-xs font-bold uppercase tracking-[0.08em]">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-2">
              <span aria-hidden>★</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="border-b border-line bg-brand-100/60">
        <Container className="grid gap-10 py-14 sm:py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
              Career guidance platform
            </p>
            <h1 className="mt-3.5 font-serif text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink-900 sm:text-[52px]">
              Advice that actually
              <br />
              <em className="text-brand-600">moves careers.</em>
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink-600 sm:text-base">
              Expert articles, video guides, and real interview prep — curated by
              practitioners, not algorithms. Join 42,000 professionals levelling up.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                href="/login?mode=signup"
                className="inline-flex items-center rounded-full bg-brand-500 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600"
              >
                Start reading free
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center rounded-full border border-line-strong bg-white px-6 py-3 text-sm font-semibold text-ink-800 transition-colors hover:border-brand-500 hover:text-brand-700"
              >
                Browse articles
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-8 border-t border-line pt-6">
              {STATS.map((s) => (
                <div key={s.label}>
                  <p className="font-serif text-2xl font-semibold text-ink-900">{s.value}</p>
                  <p className="text-xs text-ink-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Collage — uses real cover art when available, brand tiles otherwise */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="row-span-2 overflow-hidden rounded-[14px]">
              {articles[0] ? (
                <Cover article={articles[0]} className="h-full w-full min-h-[280px]" priority />
              ) : (
                <div className="h-full min-h-[280px] w-full bg-gradient-to-br from-brand-300 to-brand-600" />
              )}
            </div>
            <div className="overflow-hidden rounded-[14px]">
              {articles[1] ? (
                <Cover article={articles[1]} className="aspect-square w-full" />
              ) : (
                <div className="aspect-square w-full bg-gradient-to-br from-ink-700 to-brand-500" />
              )}
            </div>
            <div className="overflow-hidden rounded-[14px]">
              {articles[2] ? (
                <Cover article={articles[2]} className="aspect-square w-full" />
              ) : (
                <div className="aspect-square w-full bg-gradient-to-br from-brand-500 to-ink-800" />
              )}
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-14 sm:py-16">
        {error ? (
          <ErrorState
            message="Could not load articles right now. Please try again later."
            onRetry={() => window.location.reload()}
          />
        ) : loading ? (
          <div className="py-20">
            <Spinner label="Loading articles…" />
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
            {/* ── Main column: open teasers + locked list ──────────── */}
            <div>
              <div className="mb-6 flex items-end justify-between gap-4 border-b border-line pb-3">
                <h2 className="font-serif text-[22px] font-semibold text-ink-900">Latest</h2>
              </div>

              {openArticles.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  {openArticles.map((a, i) => (
                    <ArticleCard key={a.id} article={a} variant="standard" priority={i === 0} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-500">
                  Our career team is writing the first guides now. Check back shortly.
                </p>
              )}

              {lockedArticles.length > 0 && (
                <div className="mt-10 divide-y divide-line border-y border-line">
                  {lockedArticles.map((a) => {
                    const author = authorOf(a);
                    return (
                      <div key={a.id} className="flex items-center justify-between gap-4 py-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-ink-900">{author}</p>
                          <p className="text-xs text-ink-400">
                            {formatDate(a.publishedAt ?? a.createdAt, true)} &middot;{" "}
                            {readTime(a.contentHtml)}
                          </p>
                        </div>
                        <Link
                          href="/login"
                          className="inline-flex flex-shrink-0 items-center gap-1 text-sm font-bold text-brand-600 hover:text-brand-700"
                        >
                          Sign in
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[2.5]">
                            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Sidebar: ads ─────────────────────────────────────── */}
            <aside className="space-y-6">
              <AdBanner variant="sidebar" />
              <AdBanner variant="sidebar" />
            </aside>
          </div>
        )}
      </Container>

      {/* ── Unlock CTA banner ────────────────────────────────────── */}
      <section className="bg-brand-500 py-16 text-center text-white">
        <Container>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
            Members only
          </p>
          <h2 className="mx-auto mt-3 max-w-2xl font-serif text-[28px] font-semibold leading-tight sm:text-[36px]">
            Unlock every article, video and CV review.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
            Free membership gives you unlimited access to 600+ resources and a personal CV
            review from our expert panel.
          </p>
          <Link
            href="/login?mode=signup"
            className="mt-7 inline-flex items-center rounded-full bg-ink-900 px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-ink-800"
          >
            Join CareerBuild — it&rsquo;s free
          </Link>
        </Container>
      </section>
    </PublicShell>
  );
}
