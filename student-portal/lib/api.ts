import { getIdToken } from "@/lib/firebase";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5210";

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/* ─── Bootstrap / Profile ──────────────────────────────────────── */

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
}

export async function bootstrapStudentProfile(payload: BootstrapPayload = {}): Promise<StudentDto> {
  const res = await fetch(`${API}/api/student/auth/bootstrap`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Bootstrap failed: ${res.status}`);
  return res.json();
}

export async function getMe(): Promise<StudentDto | null> {
  const res = await fetch(`${API}/api/student/auth/me`, {
    headers: await authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getMe failed: ${res.status}`);
  return res.json();
}

/* ─── CV ─────────────────────────────────────────────────────────── */

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
  extractionStatus: string;
  extractedDataJson?: string;
  uploadedAt: string;
}

export async function getCvUploadUrl(
  fileName: string,
  mimeType: string,
  fileSize: number
): Promise<CvUploadUrlResponse> {
  const res = await fetch(`${API}/api/student/cv/upload-url`, {
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
  extractionStatus: string;
  extractedDataJson?: string;
}

export async function confirmCvUpload(
  fileName: string,
  storageKey: string,
  fileSize: number,
  mimeType: string
): Promise<CvConfirmResponse> {
  const res = await fetch(`${API}/api/student/cv/confirm`, {
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
  const res = await fetch(`${API}/api/student/cv/save-profile`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Save profile failed: ${res.status}`);
}

export async function getActiveCv(): Promise<{ cv: CvRecord; downloadUrl: string } | null> {
  const res = await fetch(`${API}/api/student/cv/active`, {
    headers: await authHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getActiveCv failed: ${res.status}`);
  return res.json();
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
  const res = await fetch(`${API}/api/student/video/upload-url`, {
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
  const res = await fetch(`${API}/api/student/video/confirm`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ fileName, storageKey, fileSize, mimeType }),
  });
  if (!res.ok) throw new Error(`Video confirm failed: ${res.status}`);
}

export async function getActiveVideo(): Promise<{ video: unknown; downloadUrl: string } | null> {
  const res = await fetch(`${API}/api/student/video/active`, {
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