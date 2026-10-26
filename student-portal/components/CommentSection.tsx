"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import type { User } from "@/lib/firebase";
import { initialsOf } from "@/lib/articles";
import {
  ApiError,
  COMMENT_MAX_LENGTH,
  deleteComment,
  fetchComments,
  postComment,
  type Comment,
} from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useAsync } from "@/hooks/useAsync";

/** One page is plenty for the threads we have; there's no "load more" yet. */
const PAGE_SIZE = 50;


function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";

  const units: [number, string][] = [
    [60, "minute"],
    [3600, "hour"],
    [86400, "day"],
    [604800, "week"],
  ];

  for (let i = units.length - 1; i >= 0; i--) {
    const [secs, label] = units[i];
    if (seconds >= secs) {
      const n = Math.floor(seconds / secs);
      return `${n} ${label}${n > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}

function Avatar({
  name,
  photoUrl,
  size = 36,
}: {
  name: string;
  photoUrl?: string;
  size?: number;
}) {
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        style={{ width: size, height: size }}
        className="flex-shrink-0 rounded-full object-cover ring-1 ring-line-strong"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size }}
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700 ring-1 ring-brand-200"
    >
      {initialsOf(name)}
    </span>
  );
}

export default function CommentSection({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const [posting, setPosting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [posted, setPosted] = useState<Comment[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data, loading, error } = useAsync(
    (signal) => fetchComments(articleId, 1, PAGE_SIZE, signal),
    [articleId]
  );

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // Grow the textarea with its content instead of scrolling inside it.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  // Rate-limit countdown — the server tells us how long via Retry-After.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "You";
  const trimmed = draft.trim();
  const canPost =
    trimmed.length > 0 && trimmed.length <= COMMENT_MAX_LENGTH && !posting && cooldown === 0;

  const sorted = useMemo(() => {
    const removed = new Set(removedIds);
    return [...posted, ...(data?.comments ?? [])]
      .filter((c) => !removed.has(c.id))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [posted, data, removedIds]);

  // The server's total still counts anything beyond the first page, so adjust
  // it by our own deltas rather than using the rendered length.
  const total = Math.max(0, (data?.total ?? 0) + posted.length - removedIds.length);

  /** 401 and 403 mean different things and must not be collapsed. */
  function reportFailure(e: unknown, fallback: string) {
    if (e instanceof ApiError && e.status === 401) {
      router.push("/login");
      return;
    }
    if (e instanceof ApiError && e.status === 403) {
      router.push("/verify-email");
      return;
    }
    toast.error(errorMessage(e, fallback));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canPost) return;

    setPosting(true);
    try {
      const created = await postComment(articleId, trimmed);
      setPosted((prev) => [created, ...prev]);
      setDraft("");
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 429) {
        // Comment posting is capped per student; hold the button for as long
        // as the server asked and keep the draft so nothing is lost.
        setCooldown(err.retryAfterSeconds ?? 60);
        toast.error(errorMessage(err, "You're posting too quickly. Try again shortly."));
      } else {
        reportFailure(err, "Couldn't post your comment. Please try again.");
      }
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteComment(id);
      setRemovedIds((prev) => [...prev, id]);
      setConfirmingId(null);
      toast.success("Comment deleted.");
    } catch (err: unknown) {
      reportFailure(err, "Couldn't delete your comment. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="mt-14 border-t border-line pt-10">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-[22px] font-semibold text-ink-900">
          Comments{" "}
          <span className="font-sans text-base font-medium text-ink-400">({total})</span>
        </h2>
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="mt-6 flex gap-3">
        <Avatar name={displayName} photoUrl={user?.photoURL ?? undefined} />

        <div className="min-w-0 flex-1">
          <div
            className={`rounded-[12px] border bg-white transition-colors ${
              focused ? "border-brand-400" : "border-line-strong"
            }`}
          >
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, COMMENT_MAX_LENGTH))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              rows={2}
              placeholder="Share what you took from this article…"
              aria-label="Write a comment"
              className="block w-full resize-none rounded-[12px] bg-transparent px-4 py-3 font-sans text-[15px] leading-relaxed text-ink-800 outline-none placeholder:text-ink-300"
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-3">
            <span
              className={`text-[11px] ${
                cooldown > 0 || draft.length > COMMENT_MAX_LENGTH - 100
                  ? "text-brand-700"
                  : "text-ink-300"
              }`}
            >
              {cooldown > 0
                ? `You can post again in ${cooldown}s`
                : draft.length > COMMENT_MAX_LENGTH - 100
                  ? `${COMMENT_MAX_LENGTH - draft.length} left`
                  : ""}
            </span>

            <div className="flex items-center gap-2">
              {draft && (
                <button
                  type="button"
                  onClick={() => setDraft("")}
                  className="rounded-full px-3 py-2 text-xs font-semibold text-ink-500 transition-colors hover:text-ink-900"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={!canPost}
                className="rounded-full bg-brand-500 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-40"
              >
                {posting ? "Posting…" : "Post comment"}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Thread */}
      {loading ? null : error && sorted.length === 0 ? (
        <p className="mt-10 rounded-[12px] border border-dashed border-line-strong px-6 py-10 text-center text-sm text-ink-400">
          We couldn&rsquo;t load the comments. Refresh the page to try again.
        </p>
      ) : sorted.length === 0 ? (
        <p className="mt-10 rounded-[12px] border border-dashed border-line-strong px-6 py-10 text-center text-sm text-ink-400">
          No comments yet. Be the first to share what you thought.
        </p>
      ) : (
        <ul className="mt-8 divide-y divide-line border-t border-line">
          {sorted.map((c) => (
            <li key={c.id} className="flex gap-3 py-5">
              <Avatar name={c.authorName} photoUrl={c.authorPhotoUrl} />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-semibold text-ink-900">{c.authorName}</span>
                  <span className="text-[11px] text-ink-400">{timeAgo(c.createdAt)}</span>
                </div>

                <p className="mt-1.5 text-[15px] leading-relaxed text-ink-700 [overflow-wrap:break-word]">
                  {c.body}
                </p>

                {/* Only the author sees this. The API refuses anyone else with
                    a 404 regardless, so hiding it is presentation, not a gate. */}
                {c.isMine && (
                  <div className="mt-2.5 flex items-center gap-3">
                    {confirmingId === c.id ? (
                      <>
                        <span className="text-xs text-ink-500">Delete this comment?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="text-xs font-semibold text-red-700 transition-colors hover:text-red-800 disabled:opacity-50"
                        >
                          {deletingId === c.id ? "Deleting…" : "Yes, delete"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmingId(null)}
                          className="text-xs font-semibold text-ink-400 transition-colors hover:text-ink-700"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmingId(c.id)}
                        className="text-xs font-semibold text-ink-400 transition-colors hover:text-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
