"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import type { User } from "@/lib/firebase";
import Link from "next/link";
import { getActiveCv, getActiveVideo, getMe, StudentDto, CvRecord, ExtractedCvData } from "@/lib/api";
import { toast } from "react-toastify";

interface CvInfo {
  cv: CvRecord;
  downloadUrl: string;
}

interface VideoInfo {
  video: { storageKey: string; status: string; processingStatus: string };
  downloadUrl: string;
}

function parseExtracted(json?: string): ExtractedCvData | null {
  if (!json) return null;
  try { return JSON.parse(json); } catch { return null; }
}

function ExtractionBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: string }> = {
    extracted:  { label: "Extracted",    cls: "bg-green-100 text-green-700 border-green-200",                      icon: "✅" },
    processing: { label: "Processing…",  cls: "bg-blue-100 text-blue-700 border-blue-200 animate-pulse",            icon: "⏳" },
    failed:     { label: "Failed",       cls: "bg-red-100 text-red-700 border-red-200",                             icon: "❌" },
    pending:    { label: "Pending",      cls: "bg-orange-100 text-orange-700 border-orange-200",                    icon: "🕐" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
}

export default function ProfilePage() {
  const [user, setUser]               = useState<User | null>(null);
  const [cvInfo, setCvInfo]           = useState<CvInfo | null>(null);
  const [videoInfo, setVideoInfo]     = useState<VideoInfo | null>(null);
  const [studentData, setStudentData] = useState<StudentDto | null>(null);
  const [loading, setLoading]         = useState(true);
  const [openingCv, setOpeningCv]     = useState(false);

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
        if (cvResult.status    === "fulfilled" && cvResult.value)    setCvInfo(cvResult.value as CvInfo);
        if (videoResult.status === "fulfilled" && videoResult.value) setVideoInfo(videoResult.value as VideoInfo);
        if (meResult.status    === "fulfilled" && meResult.value)    setStudentData(meResult.value);
      } catch (e) {
        console.error("Failed to load profile", e);
        toast.error("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentCv  = cvInfo?.cv;
  const downloadUrl = cvInfo?.downloadUrl;
  const extracted  = parseExtracted(currentCv?.extractedDataJson);
  const fullName   = user?.displayName ?? user?.email ?? "Student";

  function handleOpenCv() {
    if (!downloadUrl) { toast.error("No CV download URL available."); return; }
    setOpeningCv(true);
    try { window.open(downloadUrl, "_blank", "noopener,noreferrer"); }
    finally { setOpeningCv(false); }
  }

  return (
    <AuthGuard>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] bg-mint-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">

          {/* Hero Banner */}
          <div className="rounded-3xl bg-gradient-to-br from-forest-900 to-forest-700 p-6 shadow-[0_20px_50px_-15px_rgba(45,19,5,0.4)] sm:p-7">
            <p className="text-sm text-orange-300">Student Profile</p>
            <h1 className="font-display mt-1 text-2xl font-semibold text-white sm:text-3xl">{fullName}</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-orange-100/80">
              Manage your active CV, review auto-extracted data, and inspect reviewer notes.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

            {/* ── LEFT COLUMN ── */}
            <div className="md:col-span-2 space-y-6">

              {/* My Uploads */}
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-orange-100 pb-3 mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-forest-900 flex items-center gap-2">
                      <span>📂</span> My Uploads
                    </h3>
                    <p className="text-xs text-ink-400">Manage your uploaded CV and video introduction</p>
                  </div>
                  <Link href="/upload"
                    className="text-xs font-semibold bg-orange-600 text-white px-3 py-1.5 rounded-lg hover:bg-orange-700 transition">
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
                              currentCv?.feedbackStatus === "approved" ? "bg-green-100 text-green-700"
                              : currentCv?.feedbackStatus === "rejected" ? "bg-red-100 text-red-700"
                              : "bg-orange-100 text-orange-700"
                            }`}>
                              {currentCv?.feedbackStatus ?? "pending"}
                            </span>
                            <span className="text-[10px] text-ink-400">v{currentCv?.version}</span>
                            {currentCv?.extractionStatus && (
                              <ExtractionBadge status={currentCv.extractionStatus} />
                            )}
                          </div>
                          <div className="flex gap-2 mt-auto pt-2">
                            <button onClick={handleOpenCv} disabled={openingCv}
                              className="text-xs font-semibold text-orange-600 border border-orange-200 bg-white rounded-lg px-3 py-1.5 hover:bg-orange-600 hover:text-white transition disabled:opacity-50">
                              {openingCv ? "Opening…" : "View PDF"}
                            </button>
                            <a href={downloadUrl} download
                              className="text-xs font-semibold text-forest-900 border border-forest-900/20 bg-white rounded-lg px-3 py-1.5 hover:bg-forest-900 hover:text-white transition">
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
                            }`}>{videoInfo.video.status}</span>
                            <span className="text-[10px] text-ink-400">{videoInfo.video.processingStatus}</span>
                          </div>
                          <video src={videoInfo.downloadUrl} controls
                            className="w-full rounded-lg max-h-40 object-cover bg-black" />
                          <a href={videoInfo.downloadUrl} download
                            className="text-xs font-semibold text-forest-900 border border-forest-900/20 bg-white rounded-lg px-3 py-1.5 hover:bg-forest-900 hover:text-white transition self-start mt-auto">
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

              {/* ── CV Extracted Data Panel ── */}
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-orange-100 pb-3">
                  <div>
                    <h3 className="text-base font-semibold text-forest-900 flex items-center gap-2">
                      🤖 CV Extracted Data
                    </h3>
                    <p className="text-xs text-ink-400">Data automatically parsed from your uploaded PDF</p>
                  </div>
                  {currentCv?.extractionStatus && (
                    <ExtractionBadge status={currentCv.extractionStatus} />
                  )}
                </div>

                {/* States */}
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-4 bg-orange-50 rounded animate-pulse" />)}
                  </div>

                ) : !currentCv ? (
                  <p className="text-sm text-ink-400">Upload a CV to see extracted data here.</p>

                ) : currentCv.extractionStatus === "processing" ? (
                  <div className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-4 text-sm text-blue-700">
                    <span className="text-xl animate-spin">⏳</span>
                    <div>
                      <p className="font-semibold">Extracting your CV data…</p>
                      <p className="text-xs text-blue-500 mt-0.5">This takes a few seconds. Refresh the page shortly.</p>
                    </div>
                  </div>

                ) : currentCv.extractionStatus === "failed" ? (
                  <div className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-4 text-sm text-red-700">
                    <span className="text-xl">❌</span>
                    <div>
                      <p className="font-semibold">Extraction failed</p>
                      <p className="text-xs text-red-400 mt-0.5">Try re-uploading. Make sure the PDF has selectable text (not a scanned image).</p>
                    </div>
                  </div>

                ) : !extracted ? (
                  <p className="text-sm text-ink-400">No extracted data available.</p>

                ) : (
                  <div className="space-y-6">

                    {/* Contact Info Grid */}
                    <div>
                      <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3">
                        📋 Contact Information
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: "Name",     value: extracted.name,     icon: "👤", link: false },
                          { label: "Email",    value: extracted.email,    icon: "✉️", link: false },
                          { label: "Phone",    value: extracted.phone,    icon: "📞", link: false },
                          { label: "LinkedIn", value: extracted.linkedIn, icon: "🔗", link: true, href: extracted.linkedIn ? `https://${extracted.linkedIn}` : undefined },
                          { label: "GitHub",   value: extracted.github,   icon: "🐙", link: true, href: extracted.github ? `https://${extracted.github}` : undefined },
                        ].map(({ label, value, icon, link, href }) => (
                          <div key={label} className="rounded-xl border border-orange-100 bg-orange-50/30 px-4 py-3">
                            <span className="text-[10px] font-semibold text-ink-400 uppercase tracking-wider flex items-center gap-1">
                              <span>{icon}</span> {label}
                            </span>
                            <p className="mt-1 text-sm font-medium text-forest-900 break-all">
                              {value
                                ? link && href
                                  ? <a href={href} target="_blank" rel="noopener noreferrer"
                                      className="text-orange-600 underline underline-offset-2">{value}</a>
                                  : value
                                : <span className="text-ink-300 font-normal italic">Not detected</span>
                              }
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>


                    {/* Skills */}
                    <div>
                      <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3">
                        🛠 Skills
                      </h4>
                      {extracted.skills && extracted.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {extracted.skills.map((s, i) => (
                            <span key={i}
                              className="rounded-full bg-orange-100 border border-orange-200 px-3 py-1 text-xs font-medium text-orange-800">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-ink-400 italic">No skills detected in this CV.</p>
                      )}
                    </div>

                    {/* Education */}
                    {extracted.education && extracted.education.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3">
                          🎓 Education
                        </h4>
                        <div className="rounded-xl border border-orange-100 bg-orange-50/20 divide-y divide-orange-100">
                          {extracted.education.map((line, i) => (
                            <p key={i} className="px-4 py-3 text-sm text-ink-700 leading-relaxed">{line}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {extracted.experience && extracted.experience.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3">
                          💼 Work Experience
                        </h4>
                        <div className="rounded-xl border border-orange-100 bg-orange-50/20 divide-y divide-orange-100 max-h-80 overflow-y-auto">
                          {extracted.experience.map((line, i) => (
                            <p key={i} className="px-4 py-3 text-sm text-ink-700 leading-relaxed">{line}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <p className="text-[10px] text-ink-300 text-right pt-1 border-t border-orange-50">
                      {extracted.rawTextLength?.toLocaleString()} characters extracted from PDF
                    </p>
                  </div>
                )}
              </div>

              {/* Review Feedback */}
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-base font-semibold text-forest-900">Review Team Feedback</h3>
                <p className="text-xs text-ink-400">Latest visible review feedback from the portal administrators</p>
                <div className="mt-4 rounded-xl bg-orange-50/30 px-4 py-5 text-sm text-ink-400">
                  {loading ? "Loading feedback..." : "Review feedback will appear here once reviewed."}
                </div>
              </div>

            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="space-y-6">

              {/* Profile Details */}
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6 space-y-4">
                <h3 className="text-base font-semibold text-forest-900">Profile Details</h3>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-4 bg-orange-100/50 rounded animate-pulse" />)}
                  </div>
                ) : studentData ? (
                  <div className="space-y-3 text-sm text-ink-900">
                    {[
                      { label: "Email",      value: studentData.email },
                      { label: "Name",       value: `${studentData.firstName} ${studentData.lastName}` },
                      { label: "Phone",      value: studentData.phone || "—" },
                      { label: "University", value: studentData.university || "—" },
                      { label: "Degree",     value: studentData.degree || "—" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <span className="block text-xs font-semibold text-ink-400 uppercase tracking-wider">{label}</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-ink-400">No profile info.</div>
                )}
              </div>

              {/* Skills quick summary */}
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="text-base font-semibold text-forest-900">Skills from CV</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {!loading && extracted?.skills && extracted.skills.length > 0
                    ? extracted.skills.map((skill, i) => (
                        <span key={i}
                          className="rounded-full bg-orange-100/80 px-3 py-1 text-xs font-medium text-orange-800 border border-orange-200/50">
                          {skill}
                        </span>
                      ))
                    : !loading && (
                        <span className="text-xs text-ink-400">
                          {currentCv?.extractionStatus === "processing"
                            ? "Extracting skills…"
                            : "No skills detected yet."}
                        </span>
                      )
                  }
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
