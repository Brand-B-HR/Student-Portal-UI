"use client";

import { useRef, useState } from "react";
import { toast } from "react-toastify";
import { errorMessage } from "@/lib/errors";
import { checkMaterialFile, uploadMaterial, type MaterialKind } from "@/lib/uploads";

const OPTIONS: { kind: MaterialKind; title: string; hint: string; accept: string }[] = [
  { kind: "cv", title: "Upload your CV", hint: "PDF · up to 20MB", accept: "application/pdf" },
  { kind: "video", title: "Upload an intro video", hint: "mp4, webm… · up to 20MB", accept: "video/*" },
];

// Compact CV / intro video upload, so booking never needs a trip to the profile page
export default function MaterialUpload({ onUploaded }: { onUploaded: () => void }) {
  const inputs = useRef<Record<MaterialKind, HTMLInputElement | null>>({ cv: null, video: null });
  const [active, setActive] = useState<MaterialKind | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState<MaterialKind | null>(null);
  const [error, setError] = useState("");

  const busy = active !== null;

  async function handleFile(kind: MaterialKind, file: File | undefined) {
    if (!file || busy) return;

    const problem = checkMaterialFile(kind, file);
    if (problem) {
      setError(problem);
      return;
    }

    setError("");
    setActive(kind);
    setProgress(0);
    try {
      await uploadMaterial(kind, file, setProgress);
      toast.success(kind === "cv" ? "CV uploaded." : "Intro video uploaded.");
      onUploaded();
    } catch (e: unknown) {
      setError(errorMessage(e, "Upload failed. Please try again."));
    } finally {
      setActive(null);
      setProgress(0);
      if (inputs.current[kind]) inputs.current[kind]!.value = "";
    }
  }

  return (
    <div className="rounded-[14px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
      <h2 className="font-serif text-lg font-semibold text-ink-900">Add your CV or an intro video</h2>
      <p className="mt-1 text-sm text-ink-500">
        Your consultant needs one of these to prepare. Upload it here and carry straight on to pick a time.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((o) => (
          <div key={o.kind}>
            <input
              ref={(el) => {
                inputs.current[o.kind] = el;
              }}
              type="file"
              accept={o.accept}
              className="hidden"
              aria-label={o.title}
              onChange={(e) => handleFile(o.kind, e.target.files?.[0])}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => inputs.current[o.kind]?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(o.kind);
              }}
              onDragLeave={() => setDragging(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(null);
                handleFile(o.kind, e.dataTransfer.files?.[0]);
              }}
              className={`flex w-full flex-col items-center gap-1 rounded-[12px] border border-dashed px-4 py-6 text-center transition-colors disabled:opacity-60 ${
                dragging === o.kind
                  ? "border-brand-500 bg-brand-100"
                  : "border-brand-300 bg-brand-50 hover:border-brand-500 hover:bg-brand-100"
              }`}
            >
              <span className="text-sm font-semibold text-ink-900">{o.title}</span>
              <span className="text-xs text-ink-500">
                {active === o.kind ? `Uploading… ${progress}%` : `${o.hint} · click or drop`}
              </span>
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
