import { API_BASE_URL } from "@/lib/config";
import { throwApiError } from "@/lib/api";
import { authHeaders } from "@/lib/http";
import { tracked } from "@/lib/loading";

// Student-only booking endpoints; the public team directory lives in lib/consultants.ts
const API = `${API_BASE_URL}/api/v1/student`;

export type ConsultationTopic = "cv_review" | "interview_prep" | "career_guidance" | "other";

export const TOPICS: { value: ConsultationTopic; label: string }[] = [
  { value: "cv_review", label: "CV review" },
  { value: "interview_prep", label: "Interview prep" },
  { value: "career_guidance", label: "Career guidance" },
  { value: "other", label: "Something else" },
];

export const MAX_NOTES_LENGTH = 1000;
export const MAX_CANCEL_REASON_LENGTH = 500;

export interface ConsultationSlot {
  id: number;
  startUtc: string;
  endUtc: string;
  durationMinutes: number;
}

export interface Eligibility {
  canBook: boolean;
  reason?: "no_cv" | "active_booking" | null;
  activeConsultationId?: number | null;
}

export type ConsultationStatus =
  | "confirmed"
  | "completed"
  | "cancelled_by_student"
  | "cancelled_by_staff"
  | "no_show";

export interface Consultation {
  id: number;
  status: ConsultationStatus;
  consultant: { id: number; fullName: string; title: string; photoUrl?: string | null };
  startUtc: string;
  endUtc: string;
  durationMinutes: number;
  topic: ConsultationTopic;
  notes?: string | null;
  meetingUrl?: string | null;
  canCancel: boolean;
  cancelDeadlineUtc: string;
  cancellationReason?: string | null;
}

export interface BookingRequest {
  slotId: number;
  topic: ConsultationTopic;
  notes?: string;
  studentTimeZone: string;
}

export async function fetchSlots(consultantId: number, signal?: AbortSignal): Promise<ConsultationSlot[]> {
  const res = await tracked(async () =>
    fetch(`${API}/consultants/${consultantId}/slots`, { headers: await authHeaders(), signal })
  );
  if (!res.ok) return throwApiError(res, `Failed to load times: ${res.status}`);
  return ((await res.json()).slots ?? []) as ConsultationSlot[];
}

export async function fetchEligibility(signal?: AbortSignal): Promise<Eligibility> {
  const res = await tracked(async () =>
    fetch(`${API}/consultations/eligibility`, { headers: await authHeaders(), signal })
  );
  if (!res.ok) return throwApiError(res, `Failed to check eligibility: ${res.status}`);
  return res.json();
}

export async function bookConsultation(request: BookingRequest): Promise<Consultation> {
  const res = await tracked(async () =>
    fetch(`${API}/consultations`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(request),
    })
  );
  if (!res.ok) return throwApiError(res, `Booking failed: ${res.status}`);
  return res.json();
}

export async function fetchMyConsultations(
  status: "upcoming" | "past",
  signal?: AbortSignal
): Promise<Consultation[]> {
  const res = await tracked(async () =>
    fetch(`${API}/consultations?status=${status}&pageSize=50`, { headers: await authHeaders(), signal })
  );
  if (!res.ok) return throwApiError(res, `Failed to load consultations: ${res.status}`);
  return ((await res.json()).consultations ?? []) as Consultation[];
}

export async function cancelConsultation(id: number, reason?: string): Promise<void> {
  const res = await tracked(async () =>
    fetch(`${API}/consultations/${id}/cancel`, {
      method: "PATCH",
      headers: await authHeaders(),
      body: JSON.stringify({ reason }),
    })
  );
  if (!res.ok) return throwApiError(res, `Cancel failed: ${res.status}`);
}

export function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export interface SlotDay {
  key: string;
  slots: ConsultationSlot[];
}

// yyyy-mm-dd of the instant in the given zone (browser zone by default)
export function dayKey(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function groupSlotsByDay(slots: ConsultationSlot[], timeZone?: string): SlotDay[] {
  const days = new Map<string, ConsultationSlot[]>();
  for (const slot of [...slots].sort((a, b) => a.startUtc.localeCompare(b.startUtc))) {
    const key = dayKey(slot.startUtc, timeZone);
    days.set(key, [...(days.get(key) ?? []), slot]);
  }
  return [...days].map(([key, daySlots]) => ({ key, slots: daySlots }));
}

export function formatTime(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(undefined, { timeZone, hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

export function formatDay(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

export function topicLabel(topic: string): string {
  return TOPICS.find((t) => t.value === topic)?.label ?? topic;
}

export function isCancelled(status: ConsultationStatus): boolean {
  return status === "cancelled_by_student" || status === "cancelled_by_staff";
}
