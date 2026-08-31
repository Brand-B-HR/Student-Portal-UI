"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import AdBanner from "@/components/AdBanner";
import { Skeleton } from "@/components/ui/States";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import type { User } from "@/lib/firebase";
import { getActiveCv, getActiveVideo, bootstrapStudentProfile, StudentDto, CvRecord, ExtractedCvData } from "@/lib/api";
import { mapExtractedCvData } from "@/lib/cvMapping";
import { toast } from "react-toastify";

interface CvInfo {
  cv: CvRecord;
  downloadUrl: string;
}

interface VideoInfo {
  video: { storageKey: string; status: string; processingStatus: string };
  downloadUrl: string;
}

function isCvInfo(value: unknown): value is CvInfo {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.downloadUrl === "string" && !!v.cv && typeof v.cv === "object";
}

// getActiveVideo() types `video` as `unknown` on the wire, so this is a real
// narrowing check — not just documentation like isCvInfo above.
function isVideoInfo(value: unknown): value is VideoInfo {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.downloadUrl !== "string" || !v.video || typeof v.video !== "object") return false;
  const video = v.video as Record<string, unknown>;
  return (
    typeof video.storageKey === "string" &&
    typeof video.status === "string" &&
    typeof video.processingStatus === "string"
  );
}

function parseExtracted(json?: string): ExtractedCvData | null {
  if (!json) return null;
  try { return JSON.parse(json); } catch { return null; }
}

const STATUS_STYLES: Record<string, string> = {
  extracted: "bg-green-100 text-green-700",
  approved: "bg-green-100 text-green-700",
  processing: "bg-blue-100 text-blue-700",
  pending: "bg-brand-100 text-brand-700",
  failed: "bg-red-100 text-red-700",
  rejected: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending review",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.04em] ${STATUS_STYLES[status] ?? "bg-surface-muted text-ink-500"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

/** Bordered card matching the rest of the site's card style. */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[14px] border border-line bg-white p-5 sm:p-6 ${className}`}>
      {children}
    </div>
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
          bootstrapStudentProfile(),
        ]);
        if (cvResult.status    === "fulfilled" && isCvInfo(cvResult.value))    setCvInfo(cvResult.value);
        if (videoResult.status === "fulfilled" && isVideoInfo(videoResult.value)) setVideoInfo(videoResult.value);
        if (meResult.status    === "fulfilled" && meResult.value)    setStudentData(meResult.value);
      } catch {
        toast.error("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const currentCv   = cvInfo?.cv;
  const downloadUrl = cvInfo?.downloadUrl;
  const extracted   = parseExtracted(currentCv?.extractedDataJson);
  const mapped      = extracted ? mapExtractedCvData(extracted) : null;
  const fullName    = user?.displayName ?? user?.email ?? "Student";

  function handleOpenCv() {
    if (!downloadUrl) { toast.error("No CV download URL available."); return; }
    setOpeningCv(true);
    try { window.open(downloadUrl, "_blank", "noopener,noreferrer"); }
    finally { setOpeningCv(false); }
  }

  return (
    <SiteShell>
      {/* ── Masthead ─────────────────────────────────────────── */}
      <section className="border-b border-line bg-brand-100">
        <Container className="py-6 sm:py-7">
          <h1 className="font-serif text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-900 sm:text-[40px]">
            {fullName}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-600">
            Manage your active CV, review auto-extracted data, and inspect reviewer notes.
          </p>
        </Container>
      </section>

      <Container className="py-10 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">

          {/* ── MAIN COLUMN ── */}
          <div className="min-w-0 space-y-10">

            {/* My Uploads */}
            <div>
              <SectionHeader
                title="My uploads"
                subtitle="Manage your uploaded CV and video introduction."
                actionLabel="Upload new"
                actionHref="/upload"
              />

              {loading ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Skeleton className="h-40 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">

                  {/* CV Card */}
                  <Card className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-brand-100 text-brand-700">
                        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current stroke-[2]">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="text-sm font-semibold text-ink-900">CV / Resume</span>
                    </div>

                    {cvInfo ? (
                      <>
                        <p className="truncate text-xs text-ink-500">{currentCv?.fileName}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={currentCv?.feedbackStatus ?? "pending"} />
                        </div>
                        <div className="mt-auto flex gap-2 pt-2">
                          <button
                            onClick={handleOpenCv}
                            disabled={openingCv}
                            className="rounded-full border border-line-strong bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-700 transition-colors hover:border-brand-500 disabled:opacity-50"
                          >
                            {openingCv ? "Opening…" : "View PDF"}
                          </button>
                          <a
                            href={downloadUrl}
                            download
                            className="rounded-full border border-line-strong bg-white px-3.5 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:border-ink-400"
                          >
                            Download
                          </a>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-ink-400">No CV uploaded yet.</p>
                    )}
                  </Card>

                  {/* Video Card */}
                  <Card className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-brand-100 text-brand-700">
                        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current stroke-[2]">
                          <path d="M15 10l4.5-3v10l-4.5-3M4 7h9a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="text-sm font-semibold text-ink-900">Video introduction</span>
                    </div>

                    {videoInfo ? (
                      <>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={videoInfo.video.status} />
                          <span className="text-[10px] text-ink-400">{videoInfo.video.processingStatus}</span>
                        </div>
                        <video src={videoInfo.downloadUrl} controls className="max-h-40 w-full rounded-[10px] bg-ink-900 object-cover" />
                        <a
                          href={videoInfo.downloadUrl}
                          download
                          className="mt-auto self-start rounded-full border border-line-strong bg-white px-3.5 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:border-ink-400"
                        >
                          Download video
                        </a>
                      </>
                    ) : (
                      <p className="text-xs text-ink-400">No video uploaded yet.</p>
                    )}
                  </Card>

                </div>
              )}
            </div>

            <AdBanner variant="strip" />

            {/* CV Extracted Data */}
            <div>
              <div className="flex items-end justify-between gap-6">
                <SectionHeader
                  title="CV extracted data"
                  subtitle="Skills, education, and experience parsed from your uploaded PDF."
                  className="flex-1"
                />
                {currentCv?.extractionStatus && <StatusBadge status={currentCv.extractionStatus} />}
              </div>

              <Card className="mt-6">
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>

                ) : !currentCv ? (
                  <p className="text-sm text-ink-400">Upload a CV to see extracted data here.</p>

                ) : currentCv.extractionStatus === "processing" ? (
                  <div className="rounded-[10px] border border-blue-100 bg-blue-50 px-4 py-4 text-sm text-blue-700">
                    <p className="font-semibold">Extracting your CV data…</p>
                    <p className="mt-0.5 text-xs text-blue-500">This takes a few seconds. Refresh the page shortly.</p>
                  </div>

                ) : currentCv.extractionStatus === "failed" ? (
                  <div className="rounded-[10px] border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700">
                    <p className="font-semibold">Extraction failed</p>
                    <p className="mt-0.5 text-xs text-red-400">Try re-uploading. Make sure the PDF has selectable text (not a scanned image).</p>
                  </div>

                ) : !extracted || !mapped ? (
                  <p className="text-sm text-ink-400">No extracted data available.</p>

                ) : (
                  <div className="space-y-6">

                    {/* Skills */}
                    <div>
                      <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-400">Skills</h4>
                      {mapped.skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {mapped.skills.map((s, i) => (
                            <span key={i} className="rounded-full border border-brand-200 bg-brand-100 px-3 py-1 text-xs font-medium text-brand-800">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs italic text-ink-400">No skills detected in this CV.</p>
                      )}
                    </div>

                    {/* Education */}
                    {mapped.education.length > 0 && (
                      <div>
                        <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-400">Education</h4>
                        <div className="divide-y divide-line rounded-[10px] border border-line">
                          {mapped.education.map((edu, i) => (
                            <div key={i} className="px-4 py-3 text-sm">
                              <div className="font-semibold text-ink-900">{edu.degree || "Degree/Education"}</div>
                              <div className="mt-0.5 text-xs text-ink-500">
                                {edu.institution && <span>{edu.institution}</span>}
                                {edu.graduationYear && <span> &middot; {edu.graduationYear}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience */}
                    {mapped.experience.length > 0 && (
                      <div>
                        <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-400">Work experience</h4>
                        <div className="max-h-80 divide-y divide-line overflow-y-auto rounded-[10px] border border-line">
                          {mapped.experience.map((exp, i) => (
                            <div key={i} className="space-y-1 px-4 py-3 text-sm">
                              <div className="font-semibold text-ink-900">{exp.title || "Job Title"}</div>
                              <div className="text-xs text-ink-500">
                                {exp.company && <span>{exp.company}</span>}
                                {(exp.startDate || exp.endDate) && (
                                  <span> &middot; {exp.startDate || ""} - {exp.endDate || ""}</span>
                                )}
                              </div>
                              {exp.description && (
                                <p className="whitespace-pre-line text-xs leading-relaxed text-ink-600">{exp.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {extracted.rawTextLength !== undefined && (
                      <p className="border-t border-line pt-3 text-right text-[10px] text-ink-300">
                        {extracted.rawTextLength.toLocaleString()} characters extracted from PDF
                      </p>
                    )}
                  </div>
                )}
              </Card>
            </div>

            <AdBanner variant="strip" />

            {/* Review Feedback */}
            <div>
              <SectionHeader
                title="Review team feedback"
                subtitle="Latest visible review feedback from the portal administrators."
              />
              <Card className="mt-6">
                <p className="text-sm text-ink-400">
                  {loading ? "Loading feedback…" : "Review feedback will appear here once reviewed."}
                </p>
              </Card>
            </div>

          </div>

          {/* ── SIDEBAR ── */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">

            {/* Profile Details — single source of truth for account fields */}
            <Card>
              <h3 className="font-serif text-[19px] font-semibold text-ink-900">Profile details</h3>

              {loading ? (
                <div className="mt-4 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : studentData ? (
                <div className="mt-4 space-y-3 text-sm">
                  {[
                    { label: "Email",      value: studentData.email },
                    { label: "Name",       value: `${studentData.firstName} ${studentData.lastName}` },
                    { label: "Phone",      value: studentData.phone || "—" },
                    { label: "University", value: studentData.university || "—" },
                    { label: "Degree",     value: studentData.degree || "—" },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <span className="block text-[11px] font-bold uppercase tracking-[0.06em] text-ink-400">{label}</span>
                      <span className="font-medium text-ink-900">{value}</span>
                    </div>
                  ))}

                  {(mapped?.student.linkedin || mapped?.student.github) && (
                    <div className="border-t border-line pt-3">
                      <span className="block text-[11px] font-bold uppercase tracking-[0.06em] text-ink-400">
                        Links from your CV
                      </span>
                      <div className="mt-1.5 space-y-1">
                        {mapped.student.linkedin && (
                          <a
                            href={`https://${mapped.student.linkedin}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block break-all text-xs font-medium text-brand-600 underline underline-offset-2"
                          >
                            {mapped.student.linkedin}
                          </a>
                        )}
                        {mapped.student.github && (
                          <a
                            href={`https://${mapped.student.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block break-all text-xs font-medium text-brand-600 underline underline-offset-2"
                          >
                            {mapped.student.github}
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-ink-400">No profile info.</p>
              )}
            </Card>

            {/* CV prompt */}
            <div className="overflow-hidden rounded-[14px] border border-brand-200 bg-white p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-brand-500 text-white">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <h3 className="mt-3.5 font-serif text-[19px] font-semibold leading-snug text-ink-900">
                Keep your CV updated
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
                Upload a new version any time to replace the CV on your profile.
              </p>
              <Link
                href="/upload"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-600"
              >
                Update your CV
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[2.5]">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </aside>
        </div>
      </Container>
    </SiteShell>
  );
}
