"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import SiteShell from "@/components/SiteShell";
import Container from "@/components/ui/Container";
import ArticleCard from "@/components/ArticleCard";
import { ArticleCardSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { ApiError, fetchSavedArticles, unsaveArticle } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useAsync } from "@/hooks/useAsync";

const PAGE_SIZE = 24;

export default function SavedArticlesPage() {
  const router = useRouter();
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data, loading, error } = useAsync(
    (signal) => fetchSavedArticles(1, PAGE_SIZE, signal),
    []
  );

  const articles = useMemo(() => {
    const removed = new Set(removedIds);
    return (data?.articles ?? []).filter((a) => !removed.has(a.id));
  }, [data, removedIds]);

  async function handleRemove(id: string) {
    setRemovingId(id);
    // Hide it straight away — this is the one page where leaving an unsaved
    // article on screen would be plainly wrong.
    setRemovedIds((prev) => [...prev, id]);
    try {
      await unsaveArticle(id);
      toast.success("Removed from your saved list.");
    } catch (e: unknown) {
      setRemovedIds((prev) => prev.filter((x) => x !== id));
      if (e instanceof ApiError && e.status === 401) {
        router.push("/login");
      } else if (e instanceof ApiError && e.status === 403) {
        router.push("/verify-email");
      } else {
        toast.error(errorMessage(e, "Couldn't remove this article. Please try again."));
      }
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <SiteShell>
      <section className="border-b border-line bg-brand-100">
        <Container className="py-6 sm:py-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
            Your library
          </p>
          <h1 className="mt-1.5 font-serif text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-900 sm:text-[40px]">
            Saved items
          </h1>
        </Container>
      </section>

      <Container className="py-10 sm:py-12">
        {error ? (
          <ErrorState
            message="We couldn't load your saved articles. Please try again in a moment."
            onRetry={() => window.location.reload()}
          />
        ) : loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-current stroke-[1.5]">
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title="Nothing saved yet"
            description="Save an article and it'll be waiting for you here. Job openings will be savable too once listings go live."
            action={
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-600"
              >
                Browse articles
              </Link>
            }
          />
        ) : (
          /* One section per saved type. Jobs becomes a sibling of this block. */
          <section>
            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">
              Articles{" "}
              <span className="tabular-nums text-ink-300">({articles.length})</span>
            </h2>

            <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a, i) => (
                <div key={a.id} className="flex flex-col gap-2">
                  <ArticleCard article={a} variant="standard" priority={i < 3} />
                  {/* Outside the card, because the card itself is one big <Link>
                      and a button inside an anchor is invalid nesting. */}
                  <button
                    type="button"
                    onClick={() => handleRemove(a.id)}
                    disabled={removingId === a.id}
                    className="self-start rounded-full px-2 py-1 text-xs font-semibold text-ink-400 transition-colors hover:text-red-700 disabled:opacity-50"
                  >
                    {removingId === a.id ? "Removing…" : "Remove from saved"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </Container>
    </SiteShell>
  );
}
