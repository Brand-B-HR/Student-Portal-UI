"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";

interface BlogArticle {
  id: string;
  title: string;
  contentHtml: string;
  coverImageUrl?: string;
  imageUrls?: string[];
  authorName?: string;
  createdAt: string;
  publishedAt?: string;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function wordCount(html: string): number {
  return html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length;
}

export default function BlogArticlePage() {
  const params = useParams<{ id: string }>();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!params.id) return;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/blog/articles/${params.id}`
        );
        if (res.status === 404) throw new Error("not_found");
        if (!res.ok) throw new Error("failed");
        setArticle(await res.json());
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "error";
        setError(msg === "not_found" ? "not_found" : "error");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  return (
    <AuthGuard>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] bg-[#fffaf3] px-4 py-8 sm:px-6 lg:px-8">
       <div className="mx-auto max-w-3xl w-full overflow-hidden">

          {/* Back */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 mb-6 group"
          >
            <svg className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Articles
          </Link>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-sm font-medium">Loading article…</span>
            </div>
          )}

          {/* Not found */}
          {!loading && error === "not_found" && (
            <div className="flex flex-col items-center py-24 gap-4 text-center">
              <span className="text-6xl">🔍</span>
              <h2 className="text-xl font-bold text-[#1a2e1a]">Article not found</h2>
              <p className="text-sm text-gray-500">This article may have been removed or is not yet published.</p>
              <Link href="/blog" className="mt-2 text-sm font-bold text-orange-600 hover:underline">
                ← Browse all articles
              </Link>
            </div>
          )}

          {/* Error */}
          {!loading && error === "error" && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center text-red-700 text-sm">
              Failed to load this article. Please try again later.
            </div>
          )}

          {/* Article */}
          {!loading && article && (
            <article>

              {/* Cover image */}
              {article.coverImageUrl && (
                <div className="mb-8 rounded-2xl overflow-hidden shadow-md relative h-64 sm:h-80">
                  <Image
                    src={article.coverImageUrl}
                    alt={article.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                    unoptimized={article.coverImageUrl.startsWith("https://brandbhrstoragedev")}
                    priority
                  />
                </div>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-wide text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-full">
                  {article.authorName ?? "BrandB HR"}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(article.publishedAt ?? article.createdAt)}
                </span>
                <span className="text-xs text-gray-400">
                  · {Math.max(1, Math.ceil(wordCount(article.contentHtml) / 200))} min read
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a2e1a] leading-tight mb-6">
                {article.title}
              </h1>

              {/* Divider */}
              <hr className="border-orange-100 mb-8" />

              {/* Content — rich HTML from Quill */}
              <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: article.contentHtml }}
              />

              {/* Footer */}
              <div className="mt-12 pt-6 border-t border-orange-100 flex items-center justify-between">
                <Link href="/blog" className="text-sm font-bold text-orange-600 hover:underline">
                  ← All Articles
                </Link>
                <span className="text-xs text-gray-400">
                  Published {formatDate(article.publishedAt ?? article.createdAt)}
                </span>
              </div>
            </article>
          )}

        </div>
      </main>
    </AuthGuard>
  );
}
