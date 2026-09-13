import { getIdToken } from "@/lib/firebase";
import { API_BASE_URL } from "@/lib/config";

// All Student.Portal.API controllers are versioned (`api/v{version}/...`
// alongside the unversioned `api/...` alias) — call through the v1 path
// explicitly so this stays pinned as later versions are added.
const API = `${API_BASE_URL}/api/v1`;

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
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
  throw new ApiError(res.status, message);
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

export async function bootstrapStudentProfile(payload: BootstrapPayload = {}): Promise<StudentDto> {
  const res = await fetch(`${API}/student/auth/bootstrap`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) return throwApiError(res, `Bootstrap failed: ${res.status}`);
  return res.json();
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
export interface CvRecord {
  id: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  version: number;
  isActive: boolean;
  feedbackStatus: string;
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
  const res = await fetch(`${API}/student/cv/upload-url`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ fileName, mimeType, fileSize }),
  });
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
  const res = await fetch(`${API}/student/cv/confirm`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ fileName, storageKey, fileSize, mimeType }),
  });
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
  const res = await fetch(`${API}/student/cv/save-profile`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Save profile failed: ${res.status}`);
}

export async function getActiveCv(): Promise<{ cv: CvRecord; downloadUrl: string } | null> {
  const res = await fetch(`${API}/student/cv/active`, {
    headers: await authHeaders(),
  });
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
    const result = await getActiveCv();
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
  const res = await fetch(`${API}/student/video/upload-url`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ fileName, mimeType, fileSize }),
  });
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
  const res = await fetch(`${API}/student/video/confirm`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ fileName, storageKey, fileSize, mimeType }),
  });
  if (!res.ok) throw new Error(`Video confirm failed: ${res.status}`);
}

export async function getActiveVideo(): Promise<{ video: unknown; downloadUrl: string } | null> {
  const res = await fetch(`${API}/student/video/active`, {
    headers: await authHeaders(),
  });
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