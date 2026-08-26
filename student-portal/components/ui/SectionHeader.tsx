import Link from "next/link";
import type { ReactNode } from "react";

/** Section title + optional subtitle and a trailing action link. */
export default function SectionHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
  eyebrow,
  className = "",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-end justify-between gap-6 ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600">
            {eyebrow}
          </p>
        )}
        <h2 className="font-serif text-[22px] font-semibold leading-tight text-ink-900 sm:text-[26px]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-ink-500">{subtitle}</p>
        )}
      </div>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="group hidden flex-shrink-0 items-center gap-1.5 rounded-full border border-line-strong bg-white px-4 py-2 text-xs font-semibold text-ink-700 transition-colors hover:border-brand-500 hover:text-brand-700 sm:inline-flex"
        >
          {actionLabel}
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[2.5] transition-transform group-hover:translate-x-0.5">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  );
}
