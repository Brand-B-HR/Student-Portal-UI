"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import type { User } from "@/lib/firebase";
import Link from "next/link";
import { getActiveCv, getActiveVideo, getMe, StudentDto } from "@/lib/api";
import { toast } from "react-toastify";

interface CvInfo {
  cv: { fileName: string; fileSize: number; mimeType: string; version: number; feedbackStatus: string; uploadedAt: string };
  downloadUrl: string;
}

interface VideoInfo {
  video: { storageKey: string; status: string; processingStatus: string };
  downloadUrl: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [cvInfo, setCvInfo] = useState<CvInfo | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [studentData, setStudentData] = useState<StudentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingCv, setOpeningCv] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [cvResult, videoResult, meResult] = await Promise.allSettled([
          getActiveCv(),
          getActiveVideo(),
          getMe(),
        ]);
        
        if (cvResult.status === "fulfilled" && cvResult.value) {
          setCvInfo(cvResult.value as CvInfo);
        }
        if (videoResult.status === "fulfilled" && videoResult.value) {
          setVideoInfo(videoResult.value as VideoInfo);
        }
        if (meResult.status === "fulfilled" && meResult.value) {
          setStudentData(meResult.value);
        }
      } catch (e) {
        console.error("Failed to load profile", e);
        toast.error("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentCv = cvInfo?.cv;
  const downloadUrl = cvInfo?.downloadUrl;

  function handleOpenCv() {
    if (!downloadUrl) {
      toast.error("No CV download URL available.");
      return;
    }
    setOpeningCv(true);
    try {
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } finally {
      setOpeningCv(false);
    }
  }

  const fullName = user?.displayName ?? user?.email ?? "Student";

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
              
              {/* My Uploads Panel */}
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-orange-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-forest-900 flex items-center gap-2">
                      <span>📂</span> My Uploads
                    </h3>
                    <p className="text-xs text-ink-400">Manage your uploaded CV and video introduction</p>
                  </div>
                  <Link
                    href="/upload"
                    className="text-xs font-semibold bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 transition"
                  >
                    + Upload New
                  </Link>
                </div>

                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-ink-400 py-2">
                    <span className="animate-spin">⏳</span> Loading your files…
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* CV Card */}
                    <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📄</span>
                        <span className="font-bold text-forest-900 text-sm">CV / Resume</span>
                      </div>
                      {cvInfo ? (
                        <>
                          <p className="text-xs text-ink-600 truncate">{currentCv?.fileName}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              currentCv?.feedbackStatus === "approved"
                                ? "bg-green-100 text-green-700"
                                : currentCv?.feedbackStatus === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-orange-100 text-orange-700"
                            }`}>
                              {currentCv?.feedbackStatus ?? "pending"}
                            </span>
                            <span className="text-[10px] text-ink-400">v{currentCv?.version}</span>
                          </div>
                          <div className="flex gap-2 mt-auto pt-2">
                            <button
                              onClick={handleOpenCv}
                              disabled={openingCv}
                              className="text-xs font-semibold text-orange-600 border border-orange-200 bg-white rounded-lg px-3 py-1.5 hover:bg-orange-600 hover:text-white transition disabled:opacity-50"
                            >
                              {openingCv ? "Opening…" : "View PDF"}
                            </button>
                            <a
                              href={downloadUrl}
                              download
                              className="text-xs font-semibold text-forest-900 border border-forest-900/20 bg-white rounded-lg px-3 py-1.5 hover:bg-forest-900 hover:text-white transition"
                            >
                              Download
                            </a>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-ink-400">No CV uploaded yet.</p>
                      )}
                    </div>

                    {/* Video Card */}
                    <div className="rounded-xl border border-orange-100 bg-orange-50/40 p-4 flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🎥</span>
                        <span className="font-bold text-forest-900 text-sm">Video Introduction</span>
                      </div>
                      {videoInfo ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              videoInfo.video.status === "active" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                            }`}>
                              {videoInfo.video.status}
                            </span>
                            <span className="text-[10px] text-ink-400">{videoInfo.video.processingStatus}</span>
                          </div>
                          <video
                            src={videoInfo.downloadUrl}
                            controls
                            className="w-full rounded-lg max-h-40 object-cover bg-black"
                          />
                          <a
                            href={videoInfo.downloadUrl}
                            download
                            className="text-xs font-semibold text-forest-900 border border-forest-900/20 bg-white rounded-lg px-3 py-1.5 hover:bg-forest-900 hover:text-white transition self-start mt-auto"
                          >
                            Download Video
                          </a>
                        </>
                      ) : (
                        <p className="text-xs text-ink-400">No video uploaded yet.</p>
                      )}
                    </div>

                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-base font-semibold text-forest-900">Review Team Feedback</h3>
                <p className="text-xs text-ink-400">Latest visible review feedback from the portal administrators</p>
                
                <div className="mt-4 rounded-xl bg-orange-50/30 px-4 py-5 text-sm text-ink-400">
                  {loading ? "Loading feedback..." : "Review feedback will appear here once reviewed."}
                </div>
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
                ) : studentData ? (
                  <div className="space-y-3 text-sm text-ink-900">
                    <div>
                      <span className="block text-xs font-semibold text-ink-400 uppercase tracking-wider">Email</span>
                      <span className="font-medium">{studentData.email}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-ink-400 uppercase tracking-wider">Name</span>
                      <span className="font-medium">{studentData.firstName} {studentData.lastName}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-ink-400 uppercase tracking-wider">Phone</span>
                      <span className="font-medium">{studentData.phone || "—"}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-ink-400 uppercase tracking-wider">University</span>
                      <span className="font-medium">{studentData.university || "—"}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-ink-400 uppercase tracking-wider">Degree</span>
                      <span className="font-medium">{studentData.degree || "—"}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-ink-400">No profile info.</div>
                )}
              </div>

              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-base font-semibold text-forest-900">Skills Profile</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {!loading && (currentCv?.skills ?? []).map((skill: string) => (
                    <span key={skill} className="rounded-full bg-orange-100/80 px-3 py-1 text-xs font-medium text-orange-800 border border-orange-200/50">
                      {skill}
                    </span>
                  ))}
                  {!loading && (!currentCv || (currentCv.skills ?? []).length === 0) && (
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
