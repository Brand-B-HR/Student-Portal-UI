"use client";

import { useState } from "react";
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

interface BlogPost {
  id: number;
  title: string;
  summary: string;
  category: string;
  readTime: string;
  date: string;
  image: string;
}

export default function DashboardPage() {
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

  const [blogs] = useState<BlogPost[]>([
    {
      id: 1,
      title: "Mastering the Technical Coding Interview in 2026",
      summary: "A comprehensive roadmap outlining key algorithms, system design paradigms, and soft-skill templates to stand out in technical assessments.",
      category: "Interview Prep",
      readTime: "6 min read",
      date: "July 2, 2026",
      image: "🎯"
    },
    {
      id: 2,
      title: "Quantifying Achievements on a Resume",
      summary: "Learn how to use metrics, action-oriented verbs, and business impact formulas to optimize your resume bullets for ATS screening.",
      category: "Resume Tips",
      readTime: "8 min read",
      date: "June 28, 2026",
      image: "✍️"
    },
    {
      id: 3,
      title: "Leveraging LinkedIn for Referrals & Outreach",
      summary: "A step-by-step messaging framework to connect with engineering leads and secure warm internal referrals for open positions.",
      category: "Networking",
      readTime: "5 min read",
      date: "June 15, 2026",
      image: "🤝"
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
      <main className="min-h-[calc(100vh-4rem)] bg-mint-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Three-Column Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* Left/Center Column (8 cols): Job Postings */}
            <div className="lg:col-span-8 space-y-5">
              <div className="flex items-center justify-between border-b border-orange-100 pb-2">
                <h2 className="text-xl font-bold text-forest-900 flex items-center gap-2">
                  <span>💼</span> Open Job Postings
                </h2>
                <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-bold">
                  {jobs.length} Opportunities
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="group rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-2xl group-hover:scale-105 transition-transform">
                          {job.logo}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          job.type === "Internship" ? "bg-orange-100 text-orange-800" : "bg-forest-900 text-orange-100"
                        }`}>
                          {job.type}
                        </span>
                      </div>

                      <h3 className="mt-3.5 text-base font-bold text-forest-900 leading-tight">
                        {job.title}
                      </h3>
                      <p className="text-sm font-semibold text-orange-600 mt-1">
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
                          <span key={tag} className="rounded bg-orange-50 px-2 py-0.5 text-[10px] font-semibold text-orange-700 border border-orange-100/50">
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
                          : "bg-white text-orange-600 border-orange-200 hover:bg-orange-600 hover:text-white hover:border-orange-600"
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
              <Link href="/upload" className="block group">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-leaf-600 to-forest-700 p-5 text-white shadow-md hover:shadow-xl transition-shadow duration-300 flex items-center gap-4">
                  <div className="absolute -right-6 -bottom-6 text-8xl opacity-10 group-hover:scale-110 transition-transform duration-300 select-none">
                    📄
                  </div>
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 text-2xl">
                    🔄
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-white/70">CV Management</p>
                    <h3 className="text-sm font-bold leading-tight mt-0.5">Update Your CV</h3>
                    <p className="text-xs text-white/80 mt-1">Upload a new version to replace your current CV.</p>
                  </div>
                  <div className="ml-auto flex-shrink-0 relative z-10">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-white/70 fill-none stroke-2 group-hover:translate-x-1 transition-transform duration-200">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </div>
              </Link>

              {/* Ad Banners */}
              <div className="space-y-4">
                <div className="border-b border-orange-100 pb-2">
                  <h2 className="text-xl font-bold text-forest-900 flex items-center gap-2">
                    <span>📢</span> Recommended Services
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 to-orange-500 p-5 text-white shadow-sm flex flex-col justify-between min-h-[140px] group cursor-pointer">
                    <div className="absolute right-0 bottom-0 text-7xl opacity-15 translate-x-4 translate-y-4 transition-transform group-hover:scale-110 duration-300">
                      🎯
                    </div>
                    <div className="relative z-10">
                      <span className="bg-white/20 text-white rounded px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase">Bootcamp</span>
                      <h4 className="mt-2 font-bold text-base leading-tight">Mock Interview prep with Tech Leads</h4>
                      <p className="text-xs text-orange-100/90 mt-1 max-w-[200px]">Get real feedback & optimize code structure.</p>
                    </div>
                    <div className="mt-3 text-xs font-bold bg-white text-orange-600 rounded-lg py-2 px-3 self-start shadow hover:bg-orange-50 transition">
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
                      <p className="text-xs text-orange-100/90 mt-1 max-w-[200px]">Unlock more callbacks with specialized screening audits.</p>
                    </div>
                    <div className="mt-3 text-xs font-bold bg-orange-600 text-white rounded-lg py-2 px-3 self-start shadow hover:bg-orange-700 transition">
                      Submit for Audit
                    </div>
                  </div>
                </div>
              </div>

              {/* Career Guidance Blogs */}
              <div className="space-y-4">
                <div className="border-b border-orange-100 pb-2">
                  <h2 className="text-xl font-bold text-forest-900 flex items-center gap-2">
                    <span>📰</span> Career Blogs
                  </h2>
                </div>

                <div className="space-y-4">
                  {blogs.map((blog) => (
                    <div
                      key={blog.id}
                      className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm hover:border-orange-200 hover:shadow-md transition duration-200"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded bg-orange-100 px-2.5 py-0.5 text-[10px] font-bold text-orange-800 uppercase tracking-wide">
                          {blog.category}
                        </span>
                        <span className="text-[10px] text-ink-400 font-medium">{blog.readTime}</span>
                      </div>

                      <h3 className="mt-3 text-base font-bold text-forest-900 leading-snug hover:text-orange-600 transition-colors cursor-pointer">
                        {blog.title}
                      </h3>

                      <p className="mt-2 text-xs text-ink-600 leading-relaxed line-clamp-3">
                        {blog.summary}
                      </p>

                      <div className="mt-4 flex items-center justify-between text-[11px] text-ink-400 border-t border-orange-50/50 pt-3">
                        <span>{blog.date}</span>
                        <span className="text-orange-600 font-bold hover:underline cursor-pointer">Read Article →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>
    </AuthGuard>
  );
}