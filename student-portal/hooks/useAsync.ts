"use client";

import { useEffect, useState, type DependencyList } from "react";

/**
 * Runs an abortable async fetch on mount / whenever `deps` change, tracking
 * loading and error state. Cancels the in-flight request (and ignores its
 * result) when deps change again or the component unmounts, so a slow
 * response from a stale request can never clobber newer state.
 */
export function useAsync<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  deps: DependencyList = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn(ctrl.signal);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled && (e as Error).name !== "AbortError") {
          setError(e as Error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
