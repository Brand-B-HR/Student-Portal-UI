"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import type { User } from "@/lib/firebase";
import { initialsOf } from "@/lib/articles";

/**
 * Article comments — FRONT END ONLY.
 *
 * Nothing here talks to an API: comments live in component state and are lost on
 * reload. When the backend lands, replace SAMPLE_COMMENTS with a fetch and make
 * handleSubmit POST, then delete this notice. The shapes below are deliberately
 * close to what a comments API would return so that swap stays small.
 */

export interface Comment {
  id: string;
  authorName: string;
  authorPhotoUrl?: string;
  body: string;
  createdAt: string; // ISO
  likes: number;
  likedByMe?: boolean;
}

/** Placeholder content so the UI reads properly. Remove when the API is wired up. */
const SAMPLE_COMMENTS: Comment[] = [
  {
    id: "s1",
    authorName: "Nethmi Perera",
    body: "The bit about recruiters carrying 30–40 open roles explains so much. I always assumed silence meant I'd been rejected outright.",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    likes: 12,
  },
  {
    id: "s2",
    authorName: "Dinuka Fernando",
    body: "Would love a follow-up on how long to wait before sending a polite nudge.",
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    likes: 4,
  },
];

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

const MAX_LENGTH = 1000;

export default function CommentSection({ articleId }: { articleId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [comments, setComments] = useState<Comment[]>(SAMPLE_COMMENTS);
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // Grow the textarea with its content instead of scrolling inside it.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft]);

  const displayName = user?.displayName ?? user?.email?.split("@")[0] ?? "You";
  const trimmed = draft.trim();
  const canPost = trimmed.length > 0 && trimmed.length <= MAX_LENGTH;

  const sorted = useMemo(
    () => [...comments].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [comments]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canPost) return;

    setComments((prev) => [
      {
        id: crypto.randomUUID(),
        authorName: displayName,
        authorPhotoUrl: user?.photoURL ?? undefined,
        body: trimmed,
        createdAt: new Date().toISOString(),
        likes: 0,
      },
      ...prev,
    ]);
    setDraft("");
  }

  function toggleLike(id: string) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, likedByMe: !c.likedByMe, likes: c.likes + (c.likedByMe ? -1 : 1) }
          : c
      )
    );
  }

  return (
    <section className="mt-14 border-t border-line pt-10">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-[22px] font-semibold text-ink-900">
          Comments{" "}
          <span className="font-sans text-base font-medium text-ink-400">
            ({comments.length})
          </span>
        </h2>
        <span className="rounded-full border border-line bg-surface-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-ink-400">
          Preview &middot; not saved
        </span>
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
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_LENGTH))}
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
                draft.length > MAX_LENGTH - 100 ? "text-brand-700" : "text-ink-300"
              }`}
            >
              {draft.length > MAX_LENGTH - 100 && `${MAX_LENGTH - draft.length} left`}
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
                Post comment
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Thread */}
      {sorted.length === 0 ? (
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

                <div className="mt-2.5 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => toggleLike(c.id)}
                    aria-pressed={c.likedByMe ?? false}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                      c.likedByMe ? "text-brand-600" : "text-ink-400 hover:text-ink-700"
                    }`}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4 stroke-current stroke-[2]"
                      fill={c.likedByMe ? "currentColor" : "none"}
                    >
                      <path
                        d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 000-7.8z"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {c.likes > 0 && c.likes}
                  </button>

                  <button
                    type="button"
                    onClick={() => textareaRef.current?.focus()}
                    className="text-xs font-semibold text-ink-400 transition-colors hover:text-ink-700"
                  >
                    Reply
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
