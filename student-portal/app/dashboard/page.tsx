"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";

interface Job {
  id: number;
  title: string;
  company: string;
  logo: string;
  location: string;
  salary: string;
  type: string;
  tags: string[];
}

interface RealArticle {
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

export default function DashboardPage() {
  const [realArticles, setRealArticles] = useState<RealArticle[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState<boolean>(true);

  // Fetch real published blogs from API
  useEffect(() => {
    async function loadBlogs() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/blog/articles?page=1&pageSize=3`
        );
        if (res.ok) {
          const data = await res.json();
          setRealArticles(data.articles ?? []);
        }
      } catch {
        // silent catch
      } finally {
        setLoadingBlogs(false);
      }
    }
    loadBlogs();
  }, []);

  // Mock Job Postings
  const [jobs] = useState<Job[]>([
    {
      id: 1,
      title: "Software Engineering Intern",
      company: "Google",
      logo: "💻",
      location: "Mountain View, CA (Hybrid)",
      salary: "$45 - $55 / hr",
      type: "Internship",
      tags: ["React", "Python", "C++"]
    },
    {
      id: 2,
      title: "Junior Frontend Developer",
      company: "TechCorp Solutions",
      logo: "⚛️",
      location: "Remote (US)",
      salary: "$85,000 - $105,000",
      type: "Full-Time",
      tags: ["Next.js", "TypeScript", "Tailwind"]
    },
    {
      id: 3,
      title: "UX/UI Designer Intern",
      company: "Figma",
      logo: "🎨",
      location: "San Francisco, CA (Hybrid)",
      salary: "$40 - $48 / hr",
      type: "Internship",
      tags: ["Figma", "Design Systems", "Prototyping"]
    },
    {
      id: 4,
      title: "Backend Engineer",
      company: "Stripe",
      logo: "💳",
      location: "Seattle, WA (Onsite)",
      salary: "$130,000 - $155,000",
      type: "Full-Time",
      tags: ["Ruby on Rails", "Go", "SQL"]
    },
    {
      id: 5,
      title: "Full Stack Engineer",
      company: "Vercel",
      logo: "▲",
      location: "Remote (Global)",
      salary: "$110,000 - $135,000",
      type: "Full-Time",
      tags: ["Next.js", "Node.js", "Serverless"]
    },
    {
      id: 6,
      title: "Mobile App Developer Intern",
      company: "SwiftKey",
      logo: "📱",
      location: "New York, NY (Hybrid)",
      salary: "$35 - $42 / hr",
      type: "Internship",
      tags: ["React Native", "iOS", "Android"]
    }
  ]);

  const [appliedJobs, setAppliedJobs] = useState<number[]>([]);
  function handleApply(jobId: number) {
    if (appliedJobs.includes(jobId)) return;
    setAppliedJobs((prev) => [...prev, jobId]);
  }

  return (
    <AuthGuard>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] bg-[#fffaf3] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Three-Column Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left/Center Column (8 cols): Job Postings */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* Mobile Sticky Ads Slider */}
              <div className="lg:hidden sticky top-[64px] z-30 bg-[#fffaf3]/95 backdrop-blur-md pt-2 pb-4 -mx-4 px-4 border-b border-[#ef9f26]/20 shadow-xs">
                <p className="text-[9px] font-bold uppercase tracking-wider text-ink-400 mb-2">Recommended Services</p>
                <div 
                  className="flex overflow-x-auto gap-3 snap-x pb-1"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {/* Mock Interview */}
                  <div className="flex-shrink-0 w-[260px] snap-center relative overflow-hidden rounded-xl bg-gradient-to-br from-[#ef9f26] to-[#d88a18] p-4 text-white shadow-sm flex flex-col justify-between min-h-[115px] group">
                    <div className="absolute right-0 bottom-0 text-5xl opacity-15 translate-x-2 translate-y-2">
                      🎯
                    </div>
                    <div className="relative z-10">
                      <span className="bg-white/20 text-white rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase">Bootcamp</span>
                      <h4 className="mt-1 font-bold text-xs leading-tight">Mock Interview prep with Tech Leads</h4>
                    </div>
                    <div className="mt-2 text-[10px] font-bold bg-white text-[#cf8114] rounded px-2.5 py-1 self-start shadow">
                      Enroll Today
                    </div>
                  </div>

                  {/* CV Audit */}
                  <div className="flex-shrink-0 w-[260px] snap-center relative overflow-hidden rounded-xl bg-gradient-to-br from-forest-900 to-forest-800 p-4 text-white shadow-sm flex flex-col justify-between min-h-[115px] group">
                    <div className="absolute right-0 bottom-0 text-5xl opacity-15 translate-x-2 translate-y-2">
                      📝
                    </div>
                    <div className="relative z-10">
                      <span className="bg-white/20 text-white rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase">Premium Review</span>
                      <h4 className="mt-1 font-bold text-xs leading-tight">CV Audit by Senior Recruiters</h4>
                    </div>
                    <div className="mt-2 text-[10px] font-bold bg-[#ef9f26] text-white rounded px-2.5 py-1 self-start shadow">
                      Submit for Audit
                    </div>
                  </div>

                  {/* Update CV Banner */}
                  <Link href="/upload" className="flex-shrink-0 w-[260px] snap-center relative overflow-hidden rounded-xl bg-gradient-to-br from-[#ef9f26] to-forest-700 p-4 text-white shadow-sm flex flex-col justify-between min-h-[115px] group">
                    <div className="absolute -right-3 -bottom-3 text-6xl opacity-10">
                      📄
                    </div>
                    <div className="relative z-10">
                      <span className="bg-white/20 text-white rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase">CV Management</span>
                      <h4 className="mt-1 font-bold text-xs leading-tight">Update Your CV</h4>
                    </div>
                    <div className="mt-2 text-[10px] font-bold bg-white/20 text-white rounded px-2.5 py-1 self-start shadow">
                      Replace CV
                    </div>
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-between border-b border-[#ef9f26]/20 pb-2">
                <h2 className="text-xl font-bold text-forest-900 flex items-center gap-2">
                  <span>💼</span> Open Job Postings
                </h2>
                <span className="text-xs bg-[#ef9f26]/15 text-[#cf8114] border border-[#ef9f26]/30 px-2.5 py-1 rounded-full font-bold">
                  {jobs.length} Opportunities
                </span>
              </div>

              {/* Mobile Compact Job List */}
              <div className="flex flex-col gap-3 md:hidden">
                {jobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="flex items-start gap-3 rounded-2xl border border-[#ef9f26]/20 bg-white p-4 shadow-sm hover:border-[#ef9f26]/40 transition"
                  >
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#ef9f26]/10 text-2xl">
                      {job.logo}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-sm font-bold text-forest-900 truncate">{job.title}</h4>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-[#ef9f26]/20 text-[#2d1305] flex-shrink-0">
                          {job.type}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#ef9f26] mt-0.5">{job.company}</p>
                      
                      <div className="mt-2.5 flex items-center gap-2 text-[10px] text-ink-600 flex-wrap">
                        <span>📍 {job.location}</span>
                        <span>💵 {job.salary}</span>
                      </div>
                      
                      <div className="mt-2 flex flex-wrap gap-1">
                        {job.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded bg-[#ef9f26]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#cf8114] border border-[#ef9f26]/20">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleApply(job.id)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition flex-shrink-0 self-center ${
                        appliedJobs.includes(job.id)
                          ? "bg-forest-900 text-white"
                          : "bg-white text-[#ef9f26] border border-[#ef9f26] hover:bg-[#ef9f26] hover:text-white"
                      }`}
                    >
                      {appliedJobs.includes(job.id) ? "✓" : "Apply"}
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop/Tablet Grid Card View */}
              <div className="hidden md:grid md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="group rounded-2xl border border-[#ef9f26]/20 bg-white p-5 shadow-sm transition hover:border-[#ef9f26] hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ef9f26]/10 text-2xl group-hover:scale-105 transition-transform">
                          {job.logo}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          job.type === "Internship" ? "bg-[#ef9f26]/20 text-[#cf8114]" : "bg-forest-900 text-white"
                        }`}>
                          {job.type}
                        </span>
                      </div>

                      <h3 className="mt-3.5 text-base font-bold text-forest-900 leading-tight">
                        {job.title}
                      </h3>
                      <p className="text-sm font-semibold text-[#ef9f26] mt-1">
                        {job.company}
                      </p>

                      <div className="mt-4 space-y-2 text-xs text-ink-600">
                        <div className="flex items-center gap-1.5">
                          <span>📍</span> {job.location}
                        </div>
                        <div className="flex items-center gap-1.5 font-medium">
                          <span>💵</span> {job.salary}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {job.tags.map((tag) => (
                          <span key={tag} className="rounded bg-[#ef9f26]/10 px-2 py-0.5 text-[10px] font-semibold text-[#cf8114] border border-[#ef9f26]/20">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApply(job.id)}
                      className={`mt-5 w-full rounded-xl py-2.5 text-xs font-semibold transition border ${
                        appliedJobs.includes(job.id)
                          ? "bg-forest-900 text-white border-forest-900 cursor-default"
                          : "bg-white text-[#cf8114] border-[#ef9f26] hover:bg-[#ef9f26] hover:text-white"
                      }`}
                    >
                      {appliedJobs.includes(job.id) ? "✓ Applied" : "Quick Apply"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side Column (4 cols) */}
            <div className="lg:col-span-4 space-y-6">

              {/* Update CV Banner */}
              <div className="hidden lg:block">
                <Link href="/upload" className="block group">
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#ef9f26] to-forest-700 p-5 text-white shadow-md hover:shadow-xl transition-shadow duration-300 flex items-center gap-4 border border-[#ef9f26]/30">
                    <div className="absolute -right-6 -bottom-6 text-8xl opacity-10 group-hover:scale-110 transition-transform duration-300 select-none">
                      📄
                    </div>
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-2xl">
                      🔄
                    </div>
                    <div className="relative z-10">
                      <p className="text-[10px] font-bold tracking-widest uppercase text-white/80">CV Management</p>
                      <h3 className="text-sm font-bold leading-tight mt-0.5">Update Your CV</h3>
                      <p className="text-xs text-white/90 mt-1">Upload a new version to replace your current CV.</p>
                    </div>
                    <div className="ml-auto flex-shrink-0 relative z-10">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-white fill-none stroke-2 group-hover:translate-x-1 transition-transform duration-200">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Ad Banners */}
              <div className="hidden lg:block space-y-4">
                <div className="border-b border-[#ef9f26]/20 pb-2">
                  <h2 className="text-xl font-bold text-forest-900 flex items-center gap-2">
                    <span>📢</span> Recommended Services
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#ef9f26] to-[#d88a18] p-5 text-white shadow-sm flex flex-col justify-between min-h-[140px] group cursor-pointer">
                    <div className="absolute right-0 bottom-0 text-7xl opacity-15 translate-x-4 translate-y-4 transition-transform group-hover:scale-110 duration-300">
                      🎯
                    </div>
                    <div className="relative z-10">
                      <span className="bg-white/20 text-white rounded px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase">Bootcamp</span>
                      <h4 className="mt-2 font-bold text-base leading-tight">Mock Interview prep with Tech Leads</h4>
                      <p className="text-xs text-white/90 mt-1 max-w-[200px]">Get real feedback &amp; optimize code structure.</p>
                    </div>
                    <div className="mt-3 text-xs font-bold bg-white text-[#cf8114] rounded-lg py-2 px-3 self-start shadow hover:bg-[#fffaf3] transition">
                      Enroll Today
                    </div>
                  </div>

                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-forest-900 to-forest-800 p-5 text-white shadow-sm flex flex-col justify-between min-h-[140px] group cursor-pointer">
                    <div className="absolute right-0 bottom-0 text-7xl opacity-15 translate-x-4 translate-y-4 transition-transform group-hover:scale-110 duration-300">
                      📝
                    </div>
                    <div className="relative z-10">
                      <span className="bg-white/20 text-white rounded px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase">Premium Review</span>
                      <h4 className="mt-2 font-bold text-base leading-tight">CV Audit by Senior Recruiters</h4>
                      <p className="text-xs text-[#ef9f26]/90 mt-1 max-w-[200px]">Unlock more callbacks with specialized screening audits.</p>
                    </div>
                    <div className="mt-3 text-xs font-bold bg-[#ef9f26] text-white rounded-lg py-2 px-3 self-start shadow hover:bg-[#d88a18] transition">
                      Submit for Audit
                    </div>
                  </div>
                </div>
              </div>

              {/* Career Guidance Blogs */}
              <div id="blogs" className="space-y-4 scroll-mt-20">
                <div className="border-b border-[#ef9f26]/20 pb-2 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-forest-900 flex items-center gap-2">
                    <span>📰</span> Career Articles
                  </h2>
                  <Link href="/blog" className="text-xs font-bold text-[#ef9f26] hover:underline">
                    View All →
                  </Link>
                </div>

                <div className="space-y-4">
                  {loadingBlogs ? (
                    <div className="p-4 text-center text-xs text-gray-400">Loading articles…</div>
                  ) : realArticles.length > 0 ? (
                    realArticles.map((article) => (
                      <Link
                        key={article.id}
                        href={`/blog/${article.id}`}
                        className="block rounded-2xl border border-[#ef9f26]/20 bg-white p-4 shadow-sm hover:border-[#ef9f26] hover:shadow-md transition duration-200"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded bg-[#ef9f26]/20 border border-[#ef9f26]/30 px-2 py-0.5 text-[10px] font-bold text-[#cf8114] uppercase tracking-wide">
                            {article.authorName ?? "BrandB HR"}
                          </span>
                          <span className="text-[10px] text-ink-400 font-medium">
                            {readTime(article.contentHtml)}
                          </span>
                        </div>

                        <h3 className="mt-2.5 text-sm font-bold text-forest-900 leading-snug hover:text-[#ef9f26] transition-colors">
                          {article.title}
                        </h3>

                        <p className="mt-1.5 text-xs text-gray-500 leading-relaxed line-clamp-2">
                          {stripHtml(article.contentHtml)}
                        </p>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 border-t border-[#ef9f26]/10 pt-2.5">
                          <span>{formatDate(article.publishedAt ?? article.createdAt)}</span>
                          <span className="text-[#ef9f26] font-bold hover:underline">Read Article →</span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-gray-500">No articles available.</div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>
    </AuthGuard>
  );
}