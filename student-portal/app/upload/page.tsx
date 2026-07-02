"use client";

import { useEffect, useRef, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { downloadMyStudentCv, uploadStudentCv } from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [currentCvUrl, setCurrentCvUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;

    (async () => {
      const response = await downloadMyStudentCv();
      if (!response.ok) {
        return;
      }

      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);
      setCurrentCvUrl(objectUrl);
    })();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, []);

  function handleFile(selectedFile: File | null) {
    if (!selectedFile) {
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setMessage("Only PDF files are accepted.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setMessage("PDF must be 5 MB or smaller.");
      return;
    }

    setFile(selectedFile);
    setSuccess(false);
    setMessage("");
  }

  async function handleUpload() {
    if (!file) {
      return;
    }

    setUploading(true);
    setProgress(0);
    setMessage("");

    const timer = window.setInterval(() => {
      setProgress((value) => Math.min(value + 12, 90));
    }, 120);

    try {
      const response = await uploadStudentCv(file);
      window.clearInterval(timer);
      setProgress(100);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Upload failed");
      }

      setSuccess(true);
      setMessage("CV uploaded successfully. Your previous CV was replaced.");
      setFile(null);
      setCurrentCvUrl(null);
    } catch (error: any) {
      setMessage(error?.message ?? "Upload failed.");
    } finally {
      window.clearInterval(timer);
      setUploading(false);
    }
  }

  return (
    <AuthGuard>
      <Navbar />
      <main className="min-h-[calc(100vh-4rem)] bg-mint-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-forest-900 to-forest-700 p-6 shadow-[0_20px_50px_-15px_rgba(15,46,31,0.4)] sm:p-7">
            <svg className="pointer-events-none absolute -top-14 -right-14 h-56 w-56 opacity-30" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="90" stroke="#6cc796" strokeOpacity="0.25" strokeWidth="1.5" />
              <circle cx="100" cy="100" r="65" stroke="#6cc796" strokeOpacity="0.3" strokeWidth="1.5" />
              <circle cx="100" cy="100" r="40" stroke="#9ddcb9" strokeOpacity="0.35" strokeWidth="1.5" />
            </svg>

            <p className="relative text-sm text-leaf-300">Student upload</p>
            <h1 className="font-display relative mt-2 text-2xl font-semibold text-white sm:text-3xl">Upload your CV</h1>
            <p className="relative mt-3 max-w-xl text-sm leading-6 text-mint-100/80">
              Upload a single PDF CV up to 5&nbsp;MB. The latest upload replaces your existing CV, and the dashboard
              updates after submission.
            </p>

            <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-xl bg-white/10 p-4">
                <div className="text-[11px] tracking-[0.2em] text-leaf-300 uppercase">Format</div>
                <div className="mt-2 text-sm font-semibold text-white">PDF only</div>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <div className="text-[11px] tracking-[0.2em] text-leaf-300 uppercase">Size</div>
                <div className="mt-2 text-sm font-semibold text-white">5 MB max</div>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <div className="text-[11px] tracking-[0.2em] text-leaf-300 uppercase">Result</div>
                <div className="mt-2 text-sm font-semibold text-white">One active CV</div>
              </div>
            </div>

            {currentCvUrl && (
              <a
                href={currentCvUrl}
                target="_blank"
                rel="noreferrer"
                className="relative mt-6 inline-flex rounded-xl border border-leaf-400/30 bg-leaf-500/15 px-4 py-3 text-sm font-medium text-leaf-200 transition hover:bg-leaf-500/25"
              >
                Open current CV
              </a>
            )}
          </section>

          <section className="rounded-3xl border border-mint-100 bg-white p-4 shadow-sm sm:p-6">
            <div
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-12 text-center transition sm:py-16 ${
                dragOver ? "border-leaf-500 bg-mint-100" : "border-leaf-300 bg-mint-50"
              }`}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files[0] ?? null);
              }}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">📤</div>
              <div className="mt-4 text-base font-medium text-forest-900">Tap to choose your PDF</div>
              <div className="mt-1 text-sm text-ink-400">Drag and drop also works on desktop</div>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </div>

            {message && (
              <div
                className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                  success ? "border border-leaf-300 bg-mint-100 text-forest-800" : "border border-amber-200 bg-amber-50 text-amber-800"
                }`}
              >
                {message}
              </div>
            )}

            {file && (
              <div className="mt-4 rounded-xl bg-mint-50 px-4 py-3 text-sm text-forest-900">
                <div className="font-medium">{file.name}</div>
                <div className="mt-1 text-ink-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
            )}

            {uploading && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-ink-400">
                  <span>Uploading</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-mint-100">
                  <div className="h-full rounded-full bg-leaf-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                className="rounded-xl bg-leaf-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? `Uploading ${progress}%` : "Upload CV"}
              </button>
              <button
                className="rounded-xl border border-mint-100 bg-white px-4 py-3 text-sm font-semibold text-forest-900 transition hover:border-leaf-400 hover:bg-mint-50"
                onClick={() => router.push("/dashboard")}
              >
                Dashboard
              </button>
            </div>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}