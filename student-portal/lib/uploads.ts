import {
  confirmCvUpload,
  confirmVideoUpload,
  getCvUploadUrl,
  getVideoUploadUrl,
  uploadToAzureBlob,
} from "@/lib/api";

// Keep the "up to 20MB" hints in the upload UIs in step with this
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export type MaterialKind = "cv" | "video";

// Error message for a bad CV file, or null when it's fine
export function checkCvFile(file: File): string | null {
  if (file.type !== "application/pdf") return "Please upload a valid PDF CV document.";
  if (file.size > MAX_UPLOAD_BYTES) return "File must be 20 MB or smaller.";
  return null;
}

export function checkVideoFile(file: File): string | null {
  if (!file.type.startsWith("video/")) return "Please upload a valid Video file.";
  if (file.size > MAX_UPLOAD_BYTES) return "File must be 20 MB or smaller.";
  return null;
}

export function checkMaterialFile(kind: MaterialKind, file: File): string | null {
  return kind === "cv" ? checkCvFile(file) : checkVideoFile(file);
}

// Upload straight to blob storage, then confirm it. CV text extraction continues in the background.
export async function uploadMaterial(
  kind: MaterialKind,
  file: File,
  onProgress?: (pct: number) => void
): Promise<void> {
  const problem = checkMaterialFile(kind, file);
  if (problem) throw new Error(problem);

  if (kind === "cv") {
    const { uploadUrl, storageKey } = await getCvUploadUrl(file.name, file.type, file.size);
    await uploadToAzureBlob(uploadUrl, file, onProgress);
    await confirmCvUpload(file.name, storageKey, file.size, file.type);
    return;
  }

  const { uploadUrl, storageKey } = await getVideoUploadUrl(file.name, file.type, file.size);
  await uploadToAzureBlob(uploadUrl, file, onProgress);
  await confirmVideoUpload(file.name, storageKey, file.size, file.type);
}
