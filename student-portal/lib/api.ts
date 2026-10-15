import { API_BASE_URL } from "@/lib/config";
import { splitName } from "@/lib/name";
import { authHeaders } from "@/lib/http";
import { tracked } from "@/lib/loading";
import type { Article, ArticleListResponse } from "@/lib/articles";

// All Student.Portal.API controllers are versioned (`api/v{version}/...`
// alongside the unversioned `api/...` alias) — call through the v1 path
// explicitly so this stays pinned as later versions are added.
const API = `${API_BASE_URL}/api/v1`;

export class ApiError extends Error {
  status: number;
  /**
   * Seconds to wait before retrying, read from the Retry-After header. Only
   * set on 429s — comment posting is capped at 10/min per student.
   */
  retryAfterSeconds?: number;
  constructor(status: number, message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

async function throwApiError(res: Response, fallback: string): Promise<never> {
  let message = fallback;
  try {
    const body = await res.json();
    if (body?.message) {
      message = body.message;
    } else if (body?.errors && typeof body.errors === "object") {
      // ASP.NET [ApiController] model validation (ValidationProblemDetails)
      message = Object.values(body.errors).flat().join(" ") || message;
    }
  } catch {
    // response had no JSON body
  }
  const retryAfter = Number(res.headers.get("Retry-After"));
  throw new ApiError(
    res.status,
    message,
    Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined
  );
}


export interface BootstrapPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  university?: string;
  degree?: string;
  graduationYear?: number;
}

export interface StudentDto {
  id: number;
  firebaseUid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  university?: string;
  degree?: string;
  graduationYear?: number;
  status: string;
  wasCreated: boolean;
}

/**
 * Builds the bootstrap payload from whatever Firebase already knows about the
 * user.
 *
 * Sign-up sends the typed name, but that first bootstrap always 403s for an
 * email/password account — the token can't be verified yet — so the call that
 * actually creates the student record is the one after verification. Without
 * this, that later call would post an empty payload and the name the user
 * typed at sign-up would be lost.
 */
export function bootstrapPayloadFromUser(user: {
  email: string | null;
  displayName: string | null;
}): BootstrapPayload {
  const payload: BootstrapPayload = {};
  if (user.email) payload.email = user.email;
  const name = user.displayName?.trim().replace(/\s+/g, " ");
  if (name) Object.assign(payload, splitName(name));
  return payload;
}

export async function bootstrapStudentProfile(
  payload: BootstrapPayload = {},
  opts: { silent?: boolean } = {}
): Promise<StudentDto> {
  const body = JSON.stringify(payload);
  const send = (forceRefresh = false) =>
    tracked(
      () =>
        authHeaders(forceRefresh).then((headers) =>
          fetch(`${API}/student/auth/bootstrap`, { method: "POST", headers, body })
        ),
      opts.silent
    );

  let res = await send();
  if (res.status === 403) {
    // 403 here means the ID token's email_verified claim was false. The user
    // may well have verified since that token was minted — tokens live an hour
    // and nothing invalidates them on verification — so mint a fresh one and
    // ask again before believing it. Only a second 403 is a real answer.
    res = await send(true);
  }
  if (!res.ok) return throwApiError(res, `Bootstrap failed: ${res.status}`);
  return res.json();
}


/* ─── Article actions ────────────────────────────────────────────── */

/**
 * Likes, saves and comments. All of these require a signed-in, verified
 * student, so the caller is expected to send guests to /login before calling
 * rather than waiting for the 401.
 *
 * Status contract, confirmed with the API team:
 *   401 → no or invalid token          (client: send to /login)
 *   403 → signed in, email unverified  (client: send to /verify-email)
 *   404 → unknown article/comment, or another student's comment
 *   429 → comment rate limit, 10/min per student, carries Retry-After
 * These two must never be collapsed: AuthGuard already treats 403 as
 * "unverified" and routes there.
 */

export interface LikeResult {
  liked: boolean;
  likeCount: number;
}

export interface SaveResult {
  saved: boolean;
}

export interface Comment {
  id: string;
  authorName: string;
  authorPhotoUrl?: string;
  /** ISO 8601, UTC. The UI renders relative time from this itself. */
  createdAt: string;
  body: string;
  /**
   * Hardcoded to 0/false server-side today — comment likes are phase 3 and
   * have no endpoint yet. Kept on the type so landing them later is a render
   * change rather than a model change.
   */
  likes: number;
  likedByMe: boolean;
  /**
   * Whether the caller wrote this comment, computed server-side. Drives
   * whether the delete control shows. Only presentation — delete fails closed
   * with a 404 for anyone else regardless.
   */
  isMine: boolean;
}

export interface CommentListResponse {
  comments: Comment[];
  total: number;
}

/** Server rejects anything longer, measured after trimming. */
export const COMMENT_MAX_LENGTH = 1000;

async function studentRequest(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
    /** Skip the global overlay — for calls with their own feedback. */
    silent?: boolean;
  } = {}
): Promise<Response> {
  return tracked(
    async () =>
      fetch(`${API}${path}`, {
        method: options.method ?? "GET",
        headers: await authHeaders(),
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal,
      }),
    options.silent
  );
}

/**
 * Likes and saves are idempotent toggles — liking twice succeeds and returns
 * the current state rather than 409ing, so an optimistic UI that double-fires
 * won't produce a spurious error.
 */
async function toggle<T>(path: string, method: "POST" | "DELETE", fallback: string): Promise<T> {
  const res = await studentRequest(path, { method, silent: true });
  if (!res.ok) return throwApiError(res, fallback);
  return res.json();
}

export function likeArticle(articleId: string): Promise<LikeResult> {
  return toggle(`/student/articles/${articleId}/like`, "POST", "Couldn't like this article.");
}

export function unlikeArticle(articleId: string): Promise<LikeResult> {
  return toggle(`/student/articles/${articleId}/like`, "DELETE", "Couldn't remove your like.");
}

export function saveArticle(articleId: string): Promise<SaveResult> {
  return toggle(`/student/articles/${articleId}/save`, "POST", "Couldn't save this article.");
}

export function unsaveArticle(articleId: string): Promise<SaveResult> {
  return toggle(`/student/articles/${articleId}/save`, "DELETE", "Couldn't remove this from your saved list.");
}

/** Returns the same envelope as the public article list, so cards reuse it as-is. */
export async function fetchSavedArticles(
  page = 1,
  pageSize = 24,
  signal?: AbortSignal
): Promise<ArticleListResponse> {
  const res = await studentRequest(`/student/articles/saved?page=${page}&pageSize=${pageSize}`, {
    signal,
  });
  if (!res.ok) return throwApiError(res, "Couldn't load your saved articles.");
  const data = await res.json();
  return { articles: (data.articles ?? []) as Article[], total: data.total ?? 0 };
}

export async function fetchComments(
  articleId: string,
  page = 1,
  pageSize = 20,
  signal?: AbortSignal
): Promise<CommentListResponse> {
  const res = await studentRequest(
    `/student/articles/${articleId}/comments?page=${page}&pageSize=${pageSize}`,
    { signal }
  );
  if (!res.ok) return throwApiError(res, "Couldn't load comments.");
  const data = await res.json();
  return { comments: (data.comments ?? []) as Comment[], total: data.total ?? 0 };
}

/** Returns the created comment in full, so the caller can prepend without refetching. */
export async function postComment(articleId: string, body: string): Promise<Comment> {
  const res = await studentRequest(`/student/articles/${articleId}/comments`, {
    method: "POST",
    body: { body },
    silent: true, // the Post button shows its own "Posting…" state
  });
  if (!res.ok) return throwApiError(res, "Couldn't post your comment.");
  return res.json();
}

/**
 * Deletes one of the caller's own comments. Anyone else's — and an unknown or
 * already-deleted id — comes back 404 rather than 403, so this deliberately
 * can't be used to probe which comments exist.
 */
export async function deleteComment(commentId: string): Promise<void> {
  const res = await studentRequest(`/student/comments/${commentId}`, { method: "DELETE", silent: true });
  // 204 on success, so there is no body to parse.
  if (!res.ok) return throwApiError(res, "Couldn't delete your comment.");
}

export interface CvUploadUrlResponse {
  uploadUrl: string;
  storageKey: string;
  expiresInMinutes: number;
}

export interface CvExperienceItem {
  title?: string;
  company?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface CvEducationItem {
  degree?: string;
  institution?: string;
  graduationYear?: string;
}

export interface CvLinks {
  linkedIn?: string;
  github?: string;
  portfolio?: string;
  other?: string[];
}

export interface ExtractedCvData {
  status: string;
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  links?: CvLinks;
  skills?: string[];
  education?: CvEducationItem[];
  experience?: CvExperienceItem[];
  rawTextLength?: number;
}
/**
 * Reviewer workflow states for an uploaded CV. A newly confirmed upload starts
 * at "submitted_for_review"; a reviewer then moves it to one of the other two.
 * Distinct from extractionStatus, which tracks the async PDF parse.
 */
export type CvFeedbackStatus =
  | "submitted_for_review"
  | "need_enhancements"
  | "approved";

export const CV_FEEDBACK_STATUS_LABELS: Record<CvFeedbackStatus, string> = {
  submitted_for_review: "Submitted for Review",
  need_enhancements: "Need Enhancements",
  approved: "Approved",
};

export interface CvRecord {
  id: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  version: number;
  isActive: boolean;
  feedbackStatus: CvFeedbackStatus;
  feedbackText?: string;
  extractionStatus: string;
  extractedDataJson?: string;
  uploadedAt: string;
}

export async function getCvUploadUrl(
  fileName: string,
  mimeType: string,
  fileSize: number
): Promise<CvUploadUrlResponse> {
  const res = await tracked(async () => fetch(`${API}/student/cv/upload-url`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ fileName, mimeType, fileSize }),
  }));
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Failed to get CV upload URL: ${res.status}`);
  }
  return res.json();
}

export interface CvConfirmResponse {
  id: number;
  fileName: string;
  // Extraction runs async on the backend, so this is normally "processing"
  // right after confirm — extractedDataJson is only populated once a later
  // poll (see pollCvExtraction) reports "extracted".
  extractionStatus: string;
  extractedDataJson?: string;
}

export async function confirmCvUpload(
  fileName: string,
  storageKey: string,
  fileSize: number,
  mimeType: string
): Promise<CvConfirmResponse> {
  const res = await tracked(async () => fetch(`${API}/student/cv/confirm`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ fileName, storageKey, fileSize, mimeType }),
  }));
  if (!res.ok) throw new Error(`CV confirm failed: ${res.status}`);
  return res.json();
}

export interface SaveProfilePayload {
  fullName?: string;
  email?: string;
  phone?: string;
  university?: string;
  reviewedDataJson?: string;
}

export async function saveProfile(payload: SaveProfilePayload): Promise<void> {
  const res = await tracked(async () => fetch(`${API}/student/cv/save-profile`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  }));
  if (!res.ok) throw new Error(`Save profile failed: ${res.status}`);
}

export async function getActiveCv(
  opts: { silent?: boolean } = {}
): Promise<{ cv: CvRecord; downloadUrl: string } | null> {
  const res = await tracked(
    async () => fetch(`${API}/student/cv/active`, { headers: await authHeaders() }),
    opts.silent
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getActiveCv failed: ${res.status}`);
  return res.json();
}

/**
 * CV extraction now runs in a background queue, so `confirmCvUpload` returns
 * before extraction finishes. Poll `/cv/active` until the status leaves
 * "processing". Returns the resolved CvRecord, or null if it's still
 * "processing" when `timeoutMs` is reached.
 */
export async function pollCvExtraction(
  options: { intervalMs?: number; timeoutMs?: number } = {}
): Promise<CvRecord | null> {
  const intervalMs = options.intervalMs ?? 2500;
  const timeoutMs = options.timeoutMs ?? 60000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const result = await getActiveCv({ silent: true });
    if (result && result.cv.extractionStatus !== "processing") {
      return result.cv;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return null;
}

/* ─── Video ──────────────────────────────────────────────────────── */

export interface VideoUploadUrlResponse {
  uploadUrl: string;
  storageKey: string;
  expiresInMinutes: number;
}

export async function getVideoUploadUrl(
  fileName: string,
  mimeType: string,
  fileSize: number
): Promise<VideoUploadUrlResponse> {
  const res = await tracked(async () => fetch(`${API}/student/video/upload-url`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ fileName, mimeType, fileSize }),
  }));
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Failed to get video upload URL: ${res.status}`);
  }
  return res.json();
}

export async function confirmVideoUpload(
  fileName: string,
  storageKey: string,
  fileSize: number,
  mimeType: string
): Promise<void> {
  const res = await tracked(async () => fetch(`${API}/student/video/confirm`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ fileName, storageKey, fileSize, mimeType }),
  }));
  if (!res.ok) throw new Error(`Video confirm failed: ${res.status}`);
}

export async function getActiveVideo(): Promise<{ video: unknown; downloadUrl: string } | null> {
  const res = await tracked(async () => fetch(`${API}/student/video/active`, {
    headers: await authHeaders(),
  }));
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getActiveVideo failed: ${res.status}`);
  return res.json();
}

/* ─── Azure Blob direct PUT ──────────────────────────────────────── */

export async function uploadToAzureBlob(
  sasUrl: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", sasUrl, true);
    xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");
    xhr.setRequestHeader("Content-Type", file.type);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        const body = xhr.responseText || "";
        // Extract Azure error message from XML response
        const msgMatch = body.match(/<Message>(.*?)<\/Message>/);
        const detail = msgMatch ? msgMatch[1] : xhr.statusText;
        reject(new Error(`Azure upload failed (${xhr.status}): ${detail}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during Azure upload"));
    xhr.send(file);
  });
}