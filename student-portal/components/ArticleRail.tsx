"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import type { Article } from "@/lib/articles";

/**
 * Horizontal, snap-scrolling row of articles with arrow controls.
 * Arrows hide when there's nothing further to scroll in that direction.
 */
export default function ArticleRail({
  title,
  subtitle,
  articles,
  actionHref,
  actionLabel = "More",
  tinted = false,
}: {
  title: string;
  subtitle?: string;
  articles: Article[];
  actionHref?: string;
  actionLabel?: string;
  /** Soft brand-tinted band, for alternating section rhythm. */
  tinted?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    sync();
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync, articles.length]);

  function scrollBy(dir: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 260), behavior: "smooth" });
  }

  if (articles.length === 0) return null;

  return (
    <section
      className={
        tinted
          ? "rounded-[18px] border border-brand-200/70 bg-gradient-to-br from-brand-100 to-surface-subtle py-6 sm:py-7"
          : ""
      }
    >
      <div className={tinted ? "px-5 sm:px-7" : ""}>
        <div className="flex items-end justify-between gap-5">
          <div className="min-w-0">
            <h2 className="font-serif text-[22px] font-semibold leading-tight text-ink-900 sm:text-[26px]">
              {actionHref ? (
                <Link href={actionHref} className="group inline-flex items-center gap-1.5 hover:text-brand-700">
                  {title}
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2.5] transition-transform group-hover:translate-x-0.5">
                    <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              ) : (
                title
              )}
            </h2>
            {subtitle && (
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-500">{subtitle}</p>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            {/* Arrows: pointer-only affordance; touch users just swipe. */}
            <div className="hidden items-center gap-1.5 md:flex">
              <button
                type="button"
                aria-label="Scroll left"
                onClick={() => scrollBy(-1)}
                disabled={!canLeft}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-white text-ink-700 transition disabled:opacity-30 enabled:hover:border-brand-500 enabled:hover:text-brand-700"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2.5]">
                  <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Scroll right"
                onClick={() => scrollBy(1)}
                disabled={!canRight}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-white text-ink-700 transition disabled:opacity-30 enabled:hover:border-brand-500 enabled:hover:text-brand-700"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2.5]">
                  <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {actionHref && (
              <Link
                href={actionHref}
                className="rounded-full border border-ink-900 bg-white px-4 py-2 text-xs font-bold text-ink-900 transition-colors hover:bg-ink-900 hover:text-white"
              >
                {actionLabel}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div
        ref={trackRef}
        className={`rail-scroll mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 ${
          tinted ? "px-5 sm:px-7" : ""
        }`}
      >
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} variant="rail" />
        ))}
      </div>
    </section>
  );
}
