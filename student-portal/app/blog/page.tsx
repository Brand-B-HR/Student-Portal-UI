"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";

interface BlogArticle {
  id: string;
  title: string;
  contentHtml: string;
  coverImageUrl?: string;
  authorName?: string;
  createdAt: string;
  publishedAt?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function readTime(html: string): string {
  const words = stripHtml(html).split(" ").filter(Boolean).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min read`;
}

export default function BlogPage() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const pageSize = 9;

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/blog/articles?page=${page}&pageSize=${pageSize}`
        );
        if (!res.ok) throw new Error("Failed to load articles");
        const data = await res.json();
        setArticles(data.articles ?? []);
        setTotal(data.total ?? 0);
      } catch {
        setError("Could not load articles. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <AuthGuard>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] bg-[#fffaf3]">

        {/* ── Compact Header Bar ── */}
        <div className="border-b border-[#ef9f26]/20 bg-[#fffaf3] px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1a2e1a] tracking-tight">
              Blog &amp; Articles
            </h1>
            {!loading && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#cf8114] bg-[#ef9f26]/10 px-3 py-1 rounded-full border border-[#ef9f26]/30">
                📄 {total}
              </span>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
              <svg className="h-7 w-7 animate-spin text-[#ef9f26]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-sm font-medium">Loading articles…</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center text-red-700 text-sm max-w-md mx-auto">
              <span className="text-2xl mb-2 block">⚠️</span>
              {error}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && articles.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <span className="text-5xl">📭</span>
              <h2 className="text-lg font-bold text-[#1a2e1a]">No articles yet</h2>
              <p className="text-xs text-gray-500 max-w-xs">
                Check back soon — our HR team is working on career guides and tips for you.
              </p>
            </div>
          )}

          {/* Article Grid */}
          {!loading && !error && articles.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/blog/${article.id}`}
                    className="group flex flex-col rounded-2xl border border-[#ef9f26]/20 bg-white shadow-sm hover:border-[#ef9f26] hover:shadow-md transition duration-200 overflow-hidden"
                  >
                    {/* Cover Image */}
                    {article.coverImageUrl ? (
                      <div className="relative h-44 overflow-hidden bg-gray-100">
                        <Image
                          src={article.coverImageUrl}
                          alt={article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          unoptimized={article.coverImageUrl.startsWith("https://brandbhrstoragedev")}
                        />
                      </div>
                    ) : (
                      <div className="h-44 bg-gradient-to-br from-[#ef9f26]/20 to-[#ef9f26]/5 flex items-center justify-center text-5xl select-none">
                        📝
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="flex flex-col flex-1 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-[#2d1305] bg-[#ef9f26]/20 border border-[#ef9f26]/30 px-2.5 py-0.5 rounded-full">
                          {article.authorName ?? "BrandB HR"}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {readTime(article.contentHtml)}
                        </span>
                      </div>

                      <h2 className="text-base font-bold text-[#1a2e1a] leading-snug line-clamp-2 group-hover:text-[#ef9f26] transition-colors">
                        {article.title}
                      </h2>

                      <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-3 flex-1">
                        {stripHtml(article.contentHtml)}
                      </p>

                      <div className="mt-4 flex items-center justify-between border-t border-[#ef9f26]/10 pt-3 text-[11px]">
                        <span className="text-gray-400 font-medium">
                          {formatDate(article.publishedAt ?? article.createdAt)}
                        </span>
                        <span className="text-[#ef9f26] font-bold group-hover:underline flex items-center gap-1">
                          Read Article →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-xl border border-[#ef9f26]/30 px-4 py-2 text-xs font-bold text-[#2d1305] bg-[#ef9f26]/10 disabled:opacity-40 hover:bg-[#ef9f26] hover:text-white transition"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-gray-600 font-semibold px-2">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="rounded-xl border border-[#ef9f26]/30 px-4 py-2 text-xs font-bold text-[#2d1305] bg-[#ef9f26]/10 disabled:opacity-40 hover:bg-[#ef9f26] hover:text-white transition"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </AuthGuard>
  );
}
