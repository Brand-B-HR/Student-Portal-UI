import Link from "next/link";
import Badge from "@/components/ui/Badge";
import {
  type Article,
  excerpt,
  formatDate,
  readTime,
  authorOf,
  initialsOf,
} from "@/lib/articles";

/**
 * One article, five shapes.
 *  featured — hero slot, image beside a large headline
 *  standard — vertical card for grids
 *  rail     — fixed-width card for horizontal scrollers
 *  list     — thumbnail + text row (sidebars, compact lists)
 *  text     — no image, for ranked/"most read" lists
 */
export type ArticleCardVariant = "featured" | "standard" | "rail" | "list" | "text";

/** Cover art, or a deterministic branded fallback when the article has none. */
export function Cover({
  article,
  className,
  sizes,
  priority = false,
}: {
  article: Article;
  className: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (article.coverImageUrl) {
    return (
      <img
        src={article.coverImageUrl}
        alt=""
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        sizes={sizes}
        className={`${className} object-cover transition-transform duration-500 group-hover:scale-[1.04]`}
      />
    );
  }

  // Fallback: brand gradient + the article's initial. Deterministic per id.
  const hues = [
    "from-brand-400 to-brand-600",
    "from-brand-500 to-ink-700",
    "from-ink-800 to-brand-600",
    "from-brand-300 to-brand-500",
  ];
  const hue = hues[article.id.charCodeAt(0) % hues.length];

  return (
    <div
      aria-hidden
      className={`${className} bg-gradient-to-br ${hue} flex items-center justify-center`}
    >
      <span className="font-serif text-3xl font-semibold text-white/35 select-none">
        {article.title.trim()[0]?.toUpperCase() ?? "C"}
      </span>
    </div>
  );
}

export function Meta({ article, className = "" }: { article: Article; className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-[11px] text-ink-400 ${className}`}>
      <span>{formatDate(article.publishedAt ?? article.createdAt)}</span>
      <span aria-hidden>·</span>
      <span>{readTime(article.contentHtml)}</span>
    </div>
  );
}

export default function ArticleCard({
  article,
  variant = "standard",
  rank,
  priority = false,
}: {
  article: Article;
  variant?: ArticleCardVariant;
  /** 1-based position, shown by the `text` variant. */
  rank?: number;
  priority?: boolean;
}) {
  const href = `/blog/${article.id}`;
  const author = authorOf(article);

  /* ── FEATURED ─────────────────────────────────────────────── */
  if (variant === "featured") {
    return (
      <Link
        href={href}
        className="group grid overflow-hidden rounded-[14px] border border-line bg-white shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)] md:grid-cols-[1.15fr_1fr]"
      >
        <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto md:h-full md:min-h-[340px]">
          {article.coverImageUrl ? (
            <img
              src={article.coverImageUrl}
              alt=""
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : undefined}
              decoding="async"
              sizes="(max-width: 768px) 100vw, 55vw"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <Cover article={article} className="absolute inset-0 h-full w-full" />
          )}
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

  /* ── RAIL ─────────────────────────────────────────────────── */
  if (variant === "rail") {
    return (
      <Link
        href={href}
        className="group flex w-[228px] flex-shrink-0 snap-start flex-col overflow-hidden rounded-[14px] border border-line bg-white transition-shadow duration-300 hover:shadow-[var(--shadow-lift)] sm:w-[248px]"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <Cover article={article} className="absolute inset-0 h-full w-full" sizes="248px" />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="font-serif text-[17px] font-semibold leading-[1.25] text-ink-900 line-clamp-3 transition-colors group-hover:text-brand-700">
            {article.title}
          </h3>
          <Meta article={article} className="mt-auto pt-1" />
        </div>
      </Link>
    );
  }

  /* ── LIST ─────────────────────────────────────────────────── */
  if (variant === "list") {
    return (
      <Link href={href} className="group flex gap-3.5 py-3.5">
        <div className="relative h-[68px] w-[92px] flex-shrink-0 overflow-hidden rounded-[10px]">
          <Cover article={article} className="absolute inset-0 h-full w-full" sizes="92px" />
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-1">
          <h3 className="font-serif text-[15px] font-semibold leading-[1.3] text-ink-900 line-clamp-2 transition-colors group-hover:text-brand-700">
            {article.title}
          </h3>
          <Meta article={article} />
        </div>
      </Link>
    );
  }

  /* ── TEXT (ranked) ────────────────────────────────────────── */
  if (variant === "text") {
    return (
      <Link href={href} className="group flex gap-3.5 py-3.5">
        {rank !== undefined && (
          <span className="font-serif text-[26px] font-semibold leading-none text-brand-300 tabular-nums">
            {String(rank).padStart(2, "0")}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-[15px] font-semibold leading-[1.3] text-ink-900 line-clamp-2 transition-colors group-hover:text-brand-700">
            {article.title}
          </h3>
          <Meta article={article} className="mt-1" />
        </div>
      </Link>
    );
  }

  /* ── STANDARD ─────────────────────────────────────────────── */
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-[14px] border border-line bg-white shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Cover
          article={article}
          className="absolute inset-0 h-full w-full"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          priority={priority}
        />
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <Badge tone="brand" className="w-fit">{author}</Badge>

        <h3 className="font-serif text-[19px] font-semibold leading-[1.25] text-ink-900 line-clamp-2 transition-colors group-hover:text-brand-700">
          {article.title}
        </h3>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-3.5">
          <Meta article={article} />
          <span className="inline-flex flex-shrink-0 items-center gap-1 text-xs font-bold text-brand-600 transition-colors group-hover:text-brand-700">
            View blog
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[2.5]">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
