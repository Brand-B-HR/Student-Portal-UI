"use client";

import { useSyncExternalStore } from "react";
import { getLoadingVisible, subscribeLoading } from "@/lib/loading";

/**
 * The one spinner in the app.
 *
 * Exported because the CV extraction screen needs the same mark without the
 * overlay — that wait runs for up to a minute, so it can't block the page.
 * Everything else gets it through LoadingOverlay.
 */
export function Spinner({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-500 ${className}`}
    />
  );
}

/**
 * Blocking overlay shown while any tracked API call is in flight.
 *
 * Mounted once in the root layout. Reads the shared counter rather than taking
 * props, so no page has to manage a loading flag of its own.
 */
export default function LoadingOverlay() {
  const visible = useSyncExternalStore(
    subscribeLoading,
    getLoadingVisible,
    // Server render: never show it, or the markup mismatches on hydration.
    () => false
  );

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-surface-subtle/70 backdrop-blur-[2px]"
    >
      <Spinner />
    </div>
  );
}
