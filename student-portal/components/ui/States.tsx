import type { ReactNode } from "react";

/** Shimmer block used to hold layout while content loads. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gradient-to-r from-brand-100 via-surface-muted to-brand-100 ${className}`}
    />
  );
}

export function ArticleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[14px] border border-line bg-white">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-400">
      <svg className="h-6 w-6 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5z" />
      </svg>
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[14px] border border-dashed border-line-strong bg-white/60 px-6 py-16 text-center">
      {icon && <div className="text-brand-400">{icon}</div>}
      <h3 className="font-serif text-lg font-semibold text-ink-900">{title}</h3>
      {description && <p className="max-w-sm text-sm leading-relaxed text-ink-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-[14px] border border-red-200 bg-red-50/70 px-6 py-8 text-center">
      <p className="text-sm text-red-800">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
        >
          Try again
        </button>
      )}
    </div>
  );
}
