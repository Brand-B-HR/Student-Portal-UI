import type { ReactNode } from "react";

/* Loading is handled globally by LoadingOverlay, driven by lib/loading.ts —
   there are deliberately no per-page spinners or skeletons here. */

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
