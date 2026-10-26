"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { auth } from "@/lib/firebase";
import type { Article } from "@/lib/articles";
import {
  ApiError,
  likeArticle,
  saveArticle,
  unlikeArticle,
  unsaveArticle,
} from "@/lib/api";
import { errorMessage } from "@/lib/errors";

type Busy = "like" | "save" | null;

export default function ArticleActions({
  article,
  onChange,
  className = "",
}: {
  article: Article;
  onChange?: (patch: Partial<Article>) => void;
  className?: string;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(article.likedByMe);
  const [likeCount, setLikeCount] = useState(article.likeCount);
  const [saved, setSaved] = useState(article.savedByMe);
  const [busy, setBusy] = useState<Busy>(null);
  const [syncedId, setSyncedId] = useState(article.id);
  if (syncedId !== article.id) {
    setSyncedId(article.id);
    setLiked(article.likedByMe);
    setLikeCount(article.likeCount);
    setSaved(article.savedByMe);
  }

  /** True when the click was handled by sending a guest to sign in. */
  function sentToSignIn(): boolean {
    if (auth.currentUser) return false;
    router.push("/login");
    return true;
  }

  function reportFailure(e: unknown) {
    // Mirrors AuthGuard: 401 is "no session", 403 is "session but unverified".
    // Collapsing them would send guests to the verification screen.
    if (e instanceof ApiError && e.status === 401) {
      router.push("/login");
      return;
    }
    if (e instanceof ApiError && e.status === 403) {
      router.push("/verify-email");
      return;
    }
    toast.error(errorMessage(e, "Something went wrong. Please try again."));
  }

  async function toggleLike() {
    if (busy || sentToSignIn()) return;
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    setBusy("like");
    try {
      const res = next ? await likeArticle(article.id) : await unlikeArticle(article.id);
      // Trust the server's count over the local guess — other people are
      // liking the same article.
      setLiked(res.liked);
      setLikeCount(res.likeCount);
      onChange?.({ likedByMe: res.liked, likeCount: res.likeCount });
    } catch (e) {
      setLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
      reportFailure(e);
    } finally {
      setBusy(null);
    }
  }

  async function toggleSave() {
    if (busy || sentToSignIn()) return;
    const next = !saved;
    setSaved(next);
    setBusy("save");
    try {
      const res = next ? await saveArticle(article.id) : await unsaveArticle(article.id);
      setSaved(res.saved);
      onChange?.({ savedByMe: res.saved });
      toast.success(res.saved ? "Saved to read later." : "Removed from your saved list.");
    } catch (e) {
      setSaved(!next);
      reportFailure(e);
    } finally {
      setBusy(null);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy the link. You can copy it from the address bar.");
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      <button
        type="button"
        onClick={toggleLike}
        disabled={busy === "like"}
        aria-pressed={liked}
        aria-label={liked ? "Remove your like" : "Like this article"}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
          liked
            ? "border-brand-500 bg-brand-500 text-white hover:bg-brand-600"
            : "border-line-strong bg-white text-ink-700 hover:border-brand-500 hover:text-brand-700"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="h-4 w-4 stroke-current stroke-[2]"
          fill={liked ? "currentColor" : "none"}
        >
          <path
            d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 000-7.8z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {liked ? "Liked" : "Like"}
        {likeCount > 0 && (
          <span className="tabular-nums opacity-80">{likeCount}</span>
        )}
      </button>

      <button
        type="button"
        onClick={toggleSave}
        disabled={busy === "save"}
        aria-pressed={saved}
        aria-label={saved ? "Remove from your saved list" : "Save to read later"}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
          saved
            ? "border-brand-500 bg-brand-100 text-brand-800 hover:bg-brand-200"
            : "border-line-strong bg-white text-ink-700 hover:border-brand-500 hover:text-brand-700"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden
          className="h-4 w-4 stroke-current stroke-[2]"
          fill={saved ? "currentColor" : "none"}
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {saved ? "Saved" : "Save"}
      </button>

      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy a link to this article"
        className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-500 hover:text-brand-700"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-none stroke-current stroke-[2]">
          <path
            d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Share
      </button>
    </div>
  );
}
