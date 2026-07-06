"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { downloadMyStudentCv, getMyStudentCv } from "@/lib/api";

export default function ProfilePage() {
  const user = auth.currentUser;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openingCv, setOpeningCv] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await getMyStudentCv();
        if (response.ok) {
          setData(await response.json());
        }
      } catch (e) {
        console.error("Failed to load CV profile", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentCv = data?.currentCv;
  const reviews = currentCv?.reviews ?? [];
  const latestVisibleReview = reviews.find((review: any) => review.feedback) ?? reviews[0];

  async function handleOpenCv() {
    setOpeningCv(true);
    try {
      const response = await downloadMyStudentCv();
      if (!response.ok) return;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } finally {
      setOpeningCv(false);
    }
  }

  const fullName = data?.student?.fullName ?? user?.displayName ?? "Student";

  return (
    <AuthGuard>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] bg-mint-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          
          <div className="rounded-3xl bg-gradient-to-br from-forest-900 to-forest-700 p-6 shadow-[0_20px_50px_-15px_rgba(45,19,5,0.4)] sm:p-7">
            <p className="text-sm text-orange-300">Student Profile</p>
            <h1 className="font-display mt-1 text-2xl font-semibold text-white sm:text-3xl">{fullName}</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-orange-100/80">
              Manage your active CV document, review details parsed by our AI parser, and inspect reviewer notes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            
            {/* Column 1: CV Status Card */}
            <div className="md:col-span-2 space-y-6">
              
              {/* CV File Actions */}
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                  <div>
                    <h3 className="text-base font-semibold text-forest-900">Your Loaded CV</h3>
                    <p className="text-xs text-ink-400">One active document per student profile</p>
                  </div>
                  <Link
                    href="/upload"
                    className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-orange-700"
                  >
                    Upload New
                  </Link>
                </div>

                {loading ? (
                  <div className="rounded-xl bg-orange-50/30 px-4 py-5 text-sm text-ink-400">Loading CV details…</div>
                ) : currentCv ? (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-orange-50/20 p-4 border border-orange-100/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-forest-900">{currentCv.fileName}</div>
                        <div className="mt-1 text-xs text-ink-400">
                          Size: {currentCv.fileSizeKB} KB • Uploaded: {new Date(currentCv.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="self-start sm:self-auto rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                        {currentCv.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <button
                        onClick={handleOpenCv}
                        disabled={openingCv}
                        className="rounded-xl border border-orange-200 bg-white px-4 py-3 text-center text-sm font-semibold text-forest-900 transition hover:bg-orange-50 disabled:opacity-50"
                      >
                        {openingCv ? "Opening…" : "Open Reference PDF"}
                      </button>
                      <Link
                        href="/upload"
                        className="rounded-xl border border-orange-200 bg-white px-4 py-3 text-center text-sm font-semibold text-forest-900 transition hover:bg-orange-50"
                      >
                        Replace CV / Re-run Wizard
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-orange-50/30 px-4 py-5 text-center text-sm text-ink-400">
                    No active CV uploaded yet. <Link href="/upload" className="text-orange-600 font-semibold underline">Go upload yours</Link> to start.
                  </div>
                )}
              </div>

              {/* Reviewer Feedback Card */}
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-base font-semibold text-forest-900">Review Team Feedback</h3>
                <p className="text-xs text-ink-400">Latest visible review feedback from the portal administrators</p>
                
                {loading ? (
                  <div className="mt-4 rounded-xl bg-orange-50/30 px-4 py-5 text-sm text-ink-400">Loading feedback...</div>
                ) : latestVisibleReview ? (
                  <div className="mt-4 space-y-3 rounded-xl bg-orange-50/20 p-4 border border-orange-100/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-600 font-medium">Evaluation Score</span>
                      <span className="font-bold text-orange-600 text-base">{latestVisibleReview.score}/10</span>
                    </div>
                    <p className="text-sm leading-6 text-ink-900 italic">
                      "{latestVisibleReview.feedback ?? "Feedback notes will appear here once reviewed."}"
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl bg-orange-50/30 px-4 py-5 text-sm text-ink-400">No review feedback available yet.</div>
                )}
              </div>

            </div>

            {/* Column 2: Account Details & Extracted CV Fields Summary */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6 space-y-4">
                <h3 className="text-base font-semibold text-forest-900">Profile Details</h3>
                
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-orange-100/50 rounded animate-pulse" />
                    <div className="h-4 bg-orange-100/50 rounded animate-pulse" />
                    <div className="h-4 bg-orange-100/50 rounded animate-pulse" />
                  </div>
                ) : data?.student ? (
                  <div className="space-y-3 text-sm text-ink-900">
                    <div>
                      <span className="block text-xs font-semibold text-ink-400 uppercase tracking-wider">Email</span>
                      <span className="font-medium">{data.student.email}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-ink-400 uppercase tracking-wider">Phone</span>
                      <span className="font-medium">{data.student.phone || "—"}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-ink-400 uppercase tracking-wider">Location</span>
                      <span className="font-medium">{data.student.location || "—"}</span>
                    </div>
                    {data.student.linkedin && (
                      <div>
                        <span className="block text-xs font-semibold text-ink-400 uppercase tracking-wider">LinkedIn</span>
                        <a href={`https://${data.student.linkedin}`} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline">{data.student.linkedin}</a>
                      </div>
                    )}
                    {data.student.portfolio && (
                      <div>
                        <span className="block text-xs font-semibold text-ink-400 uppercase tracking-wider">Portfolio</span>
                        <a href={`https://${data.student.portfolio}`} target="_blank" rel="noreferrer" className="text-orange-600 hover:underline">{data.student.portfolio}</a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-ink-400">No profile info.</div>
                )}
              </div>

              {/* Skills Tags Card */}
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-base font-semibold text-forest-900">Skills Profile</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {!loading && currentCv?.skills?.map((skill: string) => (
                    <span key={skill} className="rounded-full bg-orange-100/80 px-3 py-1 text-xs font-medium text-orange-800 border border-orange-200/50">
                      {skill}
                    </span>
                  ))}
                  {(!currentCv || currentCv.skills?.length === 0) && (
                    <span className="text-xs text-ink-400">No skills tags extracted.</span>
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
