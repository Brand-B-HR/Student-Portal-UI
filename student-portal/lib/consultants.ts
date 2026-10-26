/**
 * The public "Our Team" consultant directory.
 *
 * Deliberately separate from lib/api.ts: ConsultantsController is
 * [AllowAnonymous] and the DTO carries no viewer-specific fields, so these
 * calls send no headers at all — not even optionalAuthHeaders. Everything
 * about *booking* a consultant is student-only and lives in lib/api.ts.
 */

import { API_BASE_URL } from "@/lib/config";
import { tracked } from "@/lib/loading";

// ConsultantsController is versioned (`api/v{version}/...` alongside the
// unversioned `api/...` alias) — call through v1 explicitly.
const API = `${API_BASE_URL}/api/v1`;

export interface Consultant {
  id: number;
  fullName: string;
  title: string;
  bio?: string;
  /**
   * A short-lived SAS read URL, re-minted on every request — never persist it
   * or hand it to a caching image loader. Null when the consultant has no
   * photo, which is why ConsultantCard carries an initials fallback.
   */
  photoUrl?: string;
  specialties: string[];
  /**
   * False still lists the person — the card just hides the book button
   * instead of dropping them from the directory.
   */
  isAcceptingBookings: boolean;
}

/**
 * Everyone currently on the team, already in name order server-side — callers
 * render the array as-is rather than re-sorting.
 */
export async function fetchConsultants(signal?: AbortSignal): Promise<Consultant[]> {
  const res = await tracked(async () => fetch(`${API}/consultants`, { signal }));
  if (!res.ok) throw new Error(`Failed to load the team: ${res.status}`);
  const data = await res.json();
  return (data.consultants ?? []) as Consultant[];
}

/** One consultant. A removed consultant 404s, same as an unknown id. */
export async function fetchConsultant(id: number, signal?: AbortSignal): Promise<Consultant> {
  const res = await tracked(async () => fetch(`${API}/consultants/${id}`, { signal }));
  if (res.status === 404) throw new Error("not_found");
  if (!res.ok) throw new Error("failed");
  return res.json();
}
