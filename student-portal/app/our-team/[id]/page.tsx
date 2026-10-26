"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import SiteShell from "@/components/SiteShell";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import MaterialUpload from "@/components/MaterialUpload";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ApiError } from "@/lib/api";
import { fetchConsultant } from "@/lib/consultants";
import {
  MAX_NOTES_LENGTH,
  TOPICS,
  bookConsultation,
  browserTimeZone,
  fetchEligibility,
  fetchSlots,
  formatDay,
  formatTime,
  groupSlotsByDay,
  type ConsultationTopic,
} from "@/lib/consultations";
import { errorMessage } from "@/lib/errors";
import { useAsync } from "@/hooks/useAsync";

export default function BookConsultantPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const consultantId = Number(params.id);
  const timeZone = useMemo(() => browserTimeZone(), []);

  // Bumped to refetch slots and eligibility after a conflict
  const [version, setVersion] = useState(0);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<number | null>(null);
  const [topic, setTopic] = useState<ConsultationTopic>("cv_review");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

  const consultant = useAsync((signal) => fetchConsultant(consultantId, signal), [consultantId]);
  const slots = useAsync((signal) => fetchSlots(consultantId, signal), [consultantId, version]);
  const eligibility = useAsync((signal) => fetchEligibility(signal), [version]);

  const days = useMemo(() => groupSlotsByDay(slots.data ?? [], timeZone), [slots.data, timeZone]);
  const activeDay = days.find((d) => d.key === dayKey) ?? days[0];
  const selected = slots.data?.find((s) => s.id === slotId) ?? null;

  const notFound = consultant.error?.message === "not_found" || Number.isNaN(consultantId);
  const person = consultant.data;
  const blocked = eligibility.data && !eligibility.data.canBook ? eligibility.data : null;
  const canBook = !!person?.isAcceptingBookings && !blocked;

  async function handleBook() {
    if (!selected || booking) return;
    setBooking(true);
    try {
      await bookConsultation({
        slotId: selected.id,
        topic,
        notes: notes.trim() || undefined,
        studentTimeZone: timeZone,
      });
      toast.success("You're booked in. We'll add the meeting link soon.");
      router.push("/consultations");
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 401) {
        router.push("/login");
        return;
      }
      if (e instanceof ApiError && e.status === 403) {
        router.push("/verify-email");
        return;
      }
      toast.error(errorMessage(e, "We couldn't book that time. Please try again."));
      // Taken slot or new active booking: show fresh availability
      if (e instanceof ApiError && (e.status === 409 || e.status === 422)) {
        setSlotId(null);
        setVersion((v) => v + 1);
      }
      setBooking(false);
    }
  }

  return (
    <SiteShell>
      <section className="border-b border-line bg-brand-100">
        <Container className="py-6 sm:py-7">
          <Link href="/our-team" className="text-xs font-semibold text-brand-700 hover:text-brand-800">
            ← Our team
          </Link>
          <h1 className="mt-2 font-serif text-[28px] font-semibold leading-tight tracking-[-0.02em] text-ink-900 sm:text-[36px]">
            {person ? `Book a session with ${person.fullName}` : "Book a session"}
          </h1>
          {person && <p className="mt-1 text-sm text-ink-500">{person.title}</p>}
        </Container>
      </section>

      <Container size="narrow" className="py-10 sm:py-12">
        {notFound ? (
          <EmptyState
            title="Consultant not found"
            description="They may no longer be on the team."
            action={<Button href="/our-team">Back to the team</Button>}
          />
        ) : consultant.error || slots.error ? (
          <ErrorState
            message="We couldn't load the available times. Please try again in a moment."
            onRetry={() => setVersion((v) => v + 1)}
          />
        ) : !person ? null : !person.isAcceptingBookings ? (
          <EmptyState
            title="Not taking bookings right now"
            description="Please choose another member of the team."
            action={<Button href="/our-team">Back to the team</Button>}
          />
        ) : blocked?.reason === "no_cv" ? (
          // Upload here and carry straight on to the times, no trip to /upload
          <MaterialUpload onUploaded={() => setVersion((v) => v + 1)} />
        ) : blocked ? (
          <ActiveBookingNotice consultationId={blocked.activeConsultationId} />
        ) : slots.loading || eligibility.loading ? null : days.length === 0 ? (
          <EmptyState
            title="No times available"
            description="There are no open times in the next 30 days. Check back soon or try another consultant."
            action={<Button href="/our-team">Back to the team</Button>}
          />
        ) : (
          <div className="flex flex-col gap-8">
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">1 · Pick a day</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {days.map((day) => {
                  const active = day.key === activeDay?.key;
                  return (
                    <button
                      key={day.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setDayKey(day.key);
                        setSlotId(null);
                      }}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                        active
                          ? "border-brand-500 bg-brand-500 text-white"
                          : "border-line-strong bg-white text-ink-700 hover:border-brand-500"
                      }`}
                    >
                      {new Intl.DateTimeFormat(undefined, {
                        timeZone,
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      }).format(new Date(day.slots[0].startUtc))}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">2 · Pick a time</h2>
              <p className="mt-1 text-xs text-ink-400">Times shown in {timeZone.replace("_", " ")}.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeDay?.slots.map((slot) => {
                  const active = slot.id === slotId;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setSlotId(slot.id)}
                      className={`rounded-[10px] border px-4 py-2 text-sm font-semibold tabular-nums transition-colors ${
                        active
                          ? "border-brand-500 bg-brand-100 text-brand-800"
                          : "border-line-strong bg-white text-ink-700 hover:border-brand-500"
                      }`}
                    >
                      {formatTime(slot.startUtc, timeZone)}
                    </button>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">3 · What&apos;s it about?</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {TOPICS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    aria-pressed={topic === t.value}
                    onClick={() => setTopic(t.value)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                      topic === t.value
                        ? "border-brand-500 bg-brand-100 text-brand-800"
                        : "border-line-strong bg-white text-ink-700 hover:border-brand-500"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <label htmlFor="notes" className="mt-5 block text-xs font-semibold text-ink-600">
                Anything we should know? <span className="font-normal text-ink-400">Optional</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={MAX_NOTES_LENGTH}
                rows={4}
                className="mt-2 w-full rounded-[12px] border border-line-strong bg-white p-3 text-sm text-ink-800 placeholder:text-ink-300"
                placeholder="e.g. applying for graduate roles in data engineering"
              />
              <p className="mt-1 text-right text-[11px] text-ink-400">
                {notes.length}/{MAX_NOTES_LENGTH}
              </p>
            </section>

            <div className="flex flex-col gap-3 rounded-[14px] border border-line bg-white p-5 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-600">
                {selected
                  ? `${formatDay(selected.startUtc, timeZone)}, ${formatTime(selected.startUtc, timeZone)} · ${selected.durationMinutes} min`
                  : "Choose a time to continue."}
              </p>
              <Button onClick={handleBook} disabled={!selected || !canBook || booking}>
                Confirm booking
              </Button>
            </div>
          </div>
        )}
      </Container>
    </SiteShell>
  );
}

function ActiveBookingNotice({ consultationId }: { consultationId?: number | null }) {
  return (
    <EmptyState
      title="You already have a session booked"
      description="Finish or cancel your upcoming consultation before booking another."
      action={<Button href={consultationId ? `/consultations#c-${consultationId}` : "/consultations"}>View my sessions</Button>}
    />
  );
}
