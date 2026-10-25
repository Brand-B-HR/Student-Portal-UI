/**
 * The public job board — approved recruitment openings from partner companies.
 *
 * Listing openings is anonymous (JobsController is [AllowAnonymous]) and sends no auth headers;
 * the apply calls at the bottom need a signed-in student.
 */

import { API_BASE_URL } from "@/lib/config";
import { throwApiError } from "@/lib/api";
import { authHeaders } from "@/lib/http";
import { tracked } from "@/lib/loading";

const API = `${API_BASE_URL}/api/v1`;

export interface JobOpening {
  id: string;
  companyId: string;
  companyName: string;
  industry?: string;
  /** The job specification (designation) being hired for. */
  specification: string;
  employmentType: string;
  vacancies: number;
  description?: string;
  neededByDate: string;
  postedAt?: string;
}

export interface JobCompany {
  id: string;
  name: string;
}

export interface JobList {
  jobs: JobOpening[];
  /** Every company with an approved opening, regardless of the active filters. */
  companies: JobCompany[];
  /** Every specification with an approved opening, regardless of the active filters. */
  specifications: string[];
}

export interface JobFilters {
  companyId?: string;
  specification?: string;
}

export async function fetchJobs(filters: JobFilters = {}, signal?: AbortSignal): Promise<JobList> {
  const params = new URLSearchParams();
  if (filters.companyId) params.set("companyId", filters.companyId);
  if (filters.specification) params.set("specification", filters.specification);
  const query = params.toString();

  const res = await tracked(async () => fetch(`${API}/jobs${query ? `?${query}` : ""}`, { signal }));
  if (!res.ok) throw new Error(`Failed to load jobs: ${res.status}`);
  const data = await res.json();
  return {
    jobs: data.jobs ?? [],
    companies: data.companies ?? [],
    specifications: data.specifications ?? [],
  };
}

/* ─── Applying (signed-in students) ──────────────────────────────── */

export interface JobApplication {
  id: string;
  recruitmentId: string;
  hasCv: boolean;
  hasVideo: boolean;
  appliedAt: string;
}

/**
 * Where an application stands, as the student is told it. Deliberately coarse: the business's own
 * statuses, scores and reasons never reach the student, and a rejection arrives as NotProgressing.
 */
export type ApplicationProgress = "Applied" | "UnderReview" | "Shortlisted" | "NotProgressing";

/** One of the student's own applications, with the job it was for. */
export interface MyApplication extends JobApplication {
  specification: string;
  companyName: string;
  employmentType: string;
  progress: ApplicationProgress;
}

/**
 * Everything the student has applied to, newest first. The jobs board only needs the ids (to mark
 * openings already applied to) and passes `silent` so that background lookup doesn't trigger the
 * global loading overlay; the My applications page wants the overlay, so it passes false.
 */
export async function fetchMyApplications(signal?: AbortSignal, silent = true): Promise<MyApplication[]> {
  const res = await tracked(
    async () => fetch(`${API}/student/jobs/applications`, { headers: await authHeaders(), signal }),
    silent
  );
  if (!res.ok) return throwApiError(res, "Couldn't load your applications.");
  return res.json();
}

/**
 * Applies with the student's *current* active CV and/or video — upload any replacement first,
 * since an upload makes the new file the active one. Throws ApiError (409 if already applied).
 */
export async function applyToJob(
  recruitmentId: string,
  attach: { includeCv: boolean; includeVideo: boolean }
): Promise<JobApplication> {
  const res = await tracked(async () =>
    fetch(`${API}/student/jobs/${recruitmentId}/apply`, {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(attach),
    })
  );
  if (!res.ok) return throwApiError(res, "Couldn't submit your application.");
  return res.json();
}
