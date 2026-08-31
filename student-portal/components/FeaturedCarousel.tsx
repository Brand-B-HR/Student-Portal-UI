"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { Cover, Meta } from "@/components/ArticleCard";
import { type Article, excerpt, authorOf, initialsOf } from "@/lib/articles";

const AUTO_ADVANCE_MS = 7000;

/**
 * The masthead's "Editor's pick" slot as a horizontally-sliding carousel
 * over the top few articles, instead of a single static featured card.
 */
export default function FeaturedCarousel({ articles }: { articles: Article[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = articles.length;

  useEffect(() => {
    if (paused || count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  if (count === 0) return null;

  const go = (i: number) => setIndex(((i % count) + count) % count);

  return (
    <div
      className="group/carousel relative overflow-hidden rounded-[14px] border border-line bg-white shadow-[var(--shadow-card)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {articles.map((article, i) => (
          <Slide key={article.id} article={article} priority={i === 0} />
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous article"
            onClick={() => go(index - 1)}
            className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-700 opacity-0 shadow-md transition-opacity duration-200 hover:bg-white group-hover/carousel:opacity-100 sm:flex"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2.5]">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label="Next article"
            onClick={() => go(index + 1)}
            className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink-700 opacity-0 shadow-md transition-opacity duration-200 hover:bg-white group-hover/carousel:opacity-100 sm:flex"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[2.5]">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 sm:left-auto sm:right-6 sm:translate-x-0 md:right-8">
            {articles.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to article ${i + 1}`}
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-6 bg-brand-500" : "w-1.5 bg-ink-300/60 hover:bg-ink-400"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Slide({ article, priority }: { article: Article; priority: boolean }) {
  const author = authorOf(article);

  return (
    <Link
      href={`/blog/${article.id}`}
      className="group grid w-full flex-shrink-0 grid-cols-1 md:grid-cols-[1.15fr_1fr]"
    >
      <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:h-full md:min-h-[340px]">
        <Cover
          article={article}
          className="absolute inset-0 h-full w-full"
          sizes="(max-width: 768px) 100vw, 55vw"
          priority={priority}
        />
      </div>

      <div className="flex flex-col justify-center gap-4 p-6 sm:p-8 lg:p-10">
        <Badge tone="solid" className="w-fit">Editor&rsquo;s pick</Badge>

        <h2 className="font-serif text-[26px] font-semibold leading-[1.15] text-ink-900 transition-colors group-hover:text-brand-700 sm:text-[32px]">
          {article.title}
        </h2>

        <p className="text-[15px] leading-relaxed text-ink-500 line-clamp-3">
          {excerpt(article.contentHtml, 210)}
        </p>

        <div className="mt-1 flex items-center gap-2.5 border-t border-line pt-4">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
            {initialsOf(author)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink-800">{author}</p>
            <Meta article={article} />
          </div>
        </div>
      </div>
    </Link>
  );
}
