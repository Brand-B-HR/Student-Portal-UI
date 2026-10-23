"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  MAX_CANCEL_REASON_LENGTH,
  formatDay,
  formatTime,
  isCancelled,
  topicLabel,
  type Consultation,
} from "@/lib/consultations";

const STATUS_LABELS: Record<Consultation["status"], string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled_by_student: "Cancelled",
  cancelled_by_staff: "Cancelled by us",
  no_show: "Missed",
};

export default function ConsultationCard({
  consultation,
  timeZone,
  cancelling,
  onCancel,
}: {
  consultation: Consultation;
  timeZone: string;
  cancelling: boolean;
  onCancel: (id: number, reason?: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const c = consultation;

  return (
    <article
      id={`c-${c.id}`}
      className="flex flex-col gap-4 rounded-[14px] border border-line bg-white p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-[19px] font-semibold leading-[1.25] text-ink-900">
            {formatDay(c.startUtc, timeZone)}
          </p>
          <p className="mt-0.5 text-sm text-ink-500">
            {formatTime(c.startUtc, timeZone)} – {formatTime(c.endUtc, timeZone)} · {c.durationMinutes} min
          </p>
        </div>
        <Badge tone={c.status === "confirmed" ? "brand" : isCancelled(c.status) ? "outline" : "neutral"}>
          {STATUS_LABELS[c.status]}
        </Badge>
      </div>

      <div className="text-sm text-ink-600">
        <p>
          <span className="font-semibold text-ink-800">{c.consultant.fullName}</span> · {c.consultant.title}
        </p>
        <p className="mt-0.5 text-ink-500">Topic: {topicLabel(c.topic)}</p>
      </div>

      {c.status === "confirmed" &&
        (c.meetingUrl ? (
          <a
            href={c.meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-600"
          >
            Join meeting
          </a>
        ) : (
          <p className="text-xs text-ink-400">The meeting link will appear here once it&apos;s ready.</p>
        ))}

      {c.cancellationReason && <p className="text-xs text-ink-400">Reason: {c.cancellationReason}</p>}

      {c.status === "confirmed" && (
        <div className="border-t border-line pt-3.5">
          {!c.canCancel ? (
            <p className="text-xs text-ink-400">
              This session can no longer be cancelled online. Please contact us if you can&apos;t attend.
            </p>
          ) : !confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-xs font-semibold text-ink-500 transition-colors hover:text-red-700"
            >
              Cancel session
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <label htmlFor={`reason-${c.id}`} className="text-xs font-semibold text-ink-600">
                Reason <span className="font-normal text-ink-400">Optional</span>
              </label>
              <textarea
                id={`reason-${c.id}`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={MAX_CANCEL_REASON_LENGTH}
                rows={2}
                className="w-full rounded-[12px] border border-line-strong bg-white p-3 text-sm text-ink-800"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="inverse"
                  disabled={cancelling}
                  onClick={() => onCancel(c.id, reason.trim() || undefined)}
                >
                  Yes, cancel it
                </Button>
                <Button size="sm" variant="secondary" disabled={cancelling} onClick={() => setConfirming(false)}>
                  Keep it
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
