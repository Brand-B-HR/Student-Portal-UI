"use client";

import { useEffect, useId, useRef, useState } from "react";
import { toast } from "react-toastify";
import Button from "@/components/ui/Button";
import { ApiError, getActiveCv, getActiveVideo } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { applyToJob, type JobOpening } from "@/lib/jobs";
import { checkMaterialFile, uploadMaterial, type MaterialKind } from "@/lib/uploads";

type Choice = "existing" | "new" | "none";

interface Existing {
  /** What to show the student so they recognise the file. */
  label: string;
}

const COPY: Record<MaterialKind, { name: string; accept: string; hint: string }> = {
  cv: { name: "CV", accept: "application/pdf", hint: "PDF · up to 20MB" },
  video: { name: "introductory video", accept: "video/*", hint: "mp4, webm… · up to 20MB" },
};

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function uploadedOn(iso?: string): string {
  return iso ? ` · uploaded ${dateFormat.format(new Date(iso))}` : "";
}

/**
 * One material (CV or video). When the student already has one they pick between continuing with
 * it, uploading a replacement, or leaving it out; with nothing on file it's upload or leave out.
 * A replacement is only uploaded on submit, so cancelling never swaps out their saved file.
 */
function MaterialChoice({
  kind,
  existing,
  choice,
  file,
  error,
  disabled,
  onChoice,
  onFile,
}: {
  kind: MaterialKind;
  existing: Existing | null;
  choice: Choice;
  file: File | null;
  error: string;
  disabled: boolean;
  onChoice: (c: Choice) => void;
  onFile: (f: File | null) => void;
}) {
  const group = useId();
  const input = useRef<HTMLInputElement>(null);
  const { name, accept, hint } = COPY[kind];

  const options: { value: Choice; label: string; detail?: string }[] = [
    ...(existing
      ? [{ value: "existing" as const, label: `Continue with my current ${name}`, detail: existing.label }]
      : []),
    { value: "new", label: existing ? `Upload a new ${name}` : `Upload my ${name}`, detail: hint },
    { value: "none", label: `Don't include a ${name}` },
  ];

  return (
    <fieldset disabled={disabled} className="rounded-[12px] border border-line p-4">
      <legend className="px-1 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-500">
        {kind === "cv" ? "CV" : "Introductory video"}
      </legend>
      <div className="space-y-2">
        {options.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-900">
            <input
              type="radio"
              name={group}
              value={o.value}
              checked={choice === o.value}
              onChange={() => onChoice(o.value)}
              className="mt-1 accent-brand-500"
            />
            <span>
              {o.label}
              {o.detail && <span className="block text-xs text-ink-500">{o.detail}</span>}
            </span>
          </label>
        ))}
      </div>

      {choice === "new" && (
        <div className="mt-3">
          <input
            ref={input}
            type="file"
            accept={accept}
            aria-label={`Choose your ${name}`}
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-ink-700 file:mr-3 file:rounded-full file:border file:border-line-strong file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-ink-900 hover:file:border-brand-500"
          />
          {file && !error && <p className="mt-1.5 text-xs text-ink-500">{file.name}</p>}
          {error && (
            <p role="alert" className="mt-1.5 text-xs text-red-700">
              {error}
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}

export default function ApplyDialog({
  job,
  onClose,
  onApplied,
}: {
  job: JobOpening;
  onClose: () => void;
  onApplied: (recruitmentId: string) => void;
}) {
  const titleId = useId();
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [cv, setCv] = useState<Existing | null>(null);
  const [video, setVideo] = useState<Existing | null>(null);
  const [cvChoice, setCvChoice] = useState<Choice>("none");
  const [videoChoice, setVideoChoice] = useState<Choice>("none");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ kind: MaterialKind; pct: number } | null>(null);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cvResult, videoResult] = await Promise.allSettled([
        getActiveCv({ silent: true }),
        getActiveVideo(),
      ]);
      if (cancelled) return;

      if (cvResult.status === "fulfilled" && cvResult.value) {
        const { cv: record } = cvResult.value;
        setCv({ label: `${record.fileName}${uploadedOn(record.uploadedAt)}` });
        setCvChoice("existing");
      }
      if (videoResult.status === "fulfilled" && videoResult.value) {
        const record = videoResult.value.video as { uploadedAt?: string } | null;
        setVideo({ label: `Saved video${uploadedOn(record?.uploadedAt)}` });
        setVideoChoice("existing");
      }
      setLoadingExisting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, submitting]);

  const cvError = cvChoice === "new" && cvFile ? checkMaterialFile("cv", cvFile) ?? "" : "";
  const videoError = videoChoice === "new" && videoFile ? checkMaterialFile("video", videoFile) ?? "" : "";

  const includesSomething = cvChoice !== "none" || videoChoice !== "none";
  const missingFile = (cvChoice === "new" && !cvFile) || (videoChoice === "new" && !videoFile);
  const canSubmit =
    !loadingExisting && !submitting && includesSomething && !missingFile && !cvError && !videoError;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setFormError("");
    try {
      if (cvChoice === "new" && cvFile) {
        await uploadMaterial("cv", cvFile, (pct) => setProgress({ kind: "cv", pct }));
      }
      if (videoChoice === "new" && videoFile) {
        await uploadMaterial("video", videoFile, (pct) => setProgress({ kind: "video", pct }));
      }
      setProgress(null);

      await applyToJob(job.id, { includeCv: cvChoice !== "none", includeVideo: videoChoice !== "none" });
      toast.success(`Application sent to ${job.companyName}.`);
      onApplied(job.id);
      onClose();
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 409) {
        // Applied from another tab or device — reflect it instead of leaving a dead Apply button.
        onApplied(job.id);
      }
      setFormError(errorMessage(e, "Couldn't submit your application. Please try again."));
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/50 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[16px] bg-white p-6 shadow-xl"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">Apply</p>
        <h2 id={titleId} className="mt-1 font-serif text-xl font-semibold text-ink-900">
          {job.specification} · {job.companyName}
        </h2>
        <p className="mt-2 text-sm text-ink-500">
          Send your CV, an introductory video, or both. If you&apos;ve already uploaded one, you can carry on
          with it or replace it.
        </p>

        <div className="mt-5 space-y-4">
          {loadingExisting ? (
            <p className="text-sm text-ink-500">Checking what you&apos;ve already uploaded…</p>
          ) : (
            <>
              <MaterialChoice
                kind="cv"
                existing={cv}
                choice={cvChoice}
                file={cvFile}
                error={cvError}
                disabled={submitting}
                onChoice={setCvChoice}
                onFile={setCvFile}
              />
              <MaterialChoice
                kind="video"
                existing={video}
                choice={videoChoice}
                file={videoFile}
                error={videoError}
                disabled={submitting}
                onChoice={setVideoChoice}
                onFile={setVideoFile}
              />
            </>
          )}
        </div>

        {!loadingExisting && !includesSomething && (
          <p className="mt-3 text-xs text-ink-500">Choose at least a CV or a video to apply.</p>
        )}
        {progress && (
          <p className="mt-3 text-sm text-ink-700">
            Uploading your {progress.kind === "cv" ? "CV" : "video"}… {progress.pct}%
          </p>
        )}
        {formError && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {formError}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            Submit application
          </Button>
        </div>
      </div>
    </div>
  );
}
