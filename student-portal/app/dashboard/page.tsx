"use client";
import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import { auth } from "@/lib/firebase";
import Link from "next/link";
import { downloadMyStudentCv, getMyStudentCv } from "@/lib/api";

export default function DashboardPage() {
  const user = auth.currentUser;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openingCv, setOpeningCv] = useState(false);

  useEffect(() => {
    (async () => {
      const response = await getMyStudentCv();
      if (!response.ok) {
        setLoading(false);
        return;
      }

      setData(await response.json());
      setLoading(false);
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

  const firstName = user?.displayName?.split(" ")[0] ?? data?.student?.fullName?.split(" ")[0] ?? "Student";

  return (
    <AuthGuard>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] bg-mint-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-5">
          <div className="rounded-3xl bg-gradient-to-br from-forest-900 to-forest-700 p-6 shadow-[0_20px_50px_-15px_rgba(15,46,31,0.4)] sm:p-7">
            <p className="text-sm text-leaf-300">Welcome back</p>
            <h1 className="font-display mt-1 text-2xl font-semibold text-white sm:text-3xl">{firstName}</h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-mint-100/80">
              Track your CV status, preview the PDF, and read reviewer feedback.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-mint-100 bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold tracking-wider text-ink-400 uppercase">CV status</div>
              <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-forest-900">
                <span className={`h-2 w-2 rounded-full ${currentCv ? "bg-leaf-500" : "bg-ink-400/40"}`} />
                {currentCv?.status ?? "No CV yet"}
              </div>
            </div>
            <div className="rounded-2xl border border-mint-100 bg-white p-5 shadow-sm">
              <div className="text-xs font-semibold tracking-wider text-ink-400 uppercase">File size</div>
              <div className="mt-2 text-lg font-semibold text-forest-900">
                {currentCv ? `${currentCv.fileSizeKB} KB` : "—"}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-mint-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-forest-900">Your CV</div>
                <div className="text-xs text-ink-400">One active PDF per student</div>
              </div>
              <Link
                href="/upload"
                className="rounded-xl bg-leaf-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-forest-700"
              >
                Upload
              </Link>
            </div>

            {loading ? (
              <div className="mt-4 rounded-xl bg-mint-50 px-4 py-5 text-sm text-ink-400">Loading CV details…</div>
            ) : currentCv ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-mint-50 px-4 py-4">
                  <div className="text-sm font-medium text-forest-900">{currentCv.fileName}</div>
                  <div className="mt-1 text-xs text-ink-400">
                    Uploaded {new Date(currentCv.uploadedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    onClick={handleOpenCv}
                    disabled={openingCv}
                    className="rounded-xl border border-mint-100 bg-white px-4 py-3 text-center text-sm font-semibold text-forest-900 transition hover:border-leaf-400 hover:bg-mint-50 disabled:opacity-50"
                  >
                    {openingCv ? "Opening…" : "Open PDF"}
                  </button>
                  <Link
                    href="/upload"
                    className="rounded-xl border border-mint-100 bg-white px-4 py-3 text-center text-sm font-semibold text-forest-900 transition hover:border-leaf-400 hover:bg-mint-50"
                  >
                    Replace CV
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-mint-50 px-4 py-5 text-sm text-ink-400">
                No CV uploaded yet. Go to upload and add your PDF.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-mint-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="text-sm font-semibold text-forest-900">Feedback</div>
            <div className="mt-1 text-xs text-ink-400">Latest visible review from the admin team</div>
            {latestVisibleReview ? (
              <div className="mt-4 space-y-3 rounded-xl bg-mint-50 px-4 py-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-600">Score</span>
                  <span className="font-semibold text-leaf-600">{latestVisibleReview.score}/10</span>
                </div>
                <p className="text-sm leading-6 text-ink-900">
                  {latestVisibleReview.feedback ?? "Feedback is hidden by the reviewer."}
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-mint-50 px-4 py-5 text-sm text-ink-400">No feedback yet.</div>
            )}
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}