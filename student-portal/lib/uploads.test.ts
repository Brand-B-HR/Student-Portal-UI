import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api", () => ({
  getCvUploadUrl: vi.fn(async () => ({ uploadUrl: "https://blob/cv", storageKey: "cv-key" })),
  confirmCvUpload: vi.fn(async () => ({ id: 1, fileName: "cv.pdf", extractionStatus: "processing" })),
  getVideoUploadUrl: vi.fn(async () => ({ uploadUrl: "https://blob/video", storageKey: "video-key", expiresInMinutes: 15 })),
  confirmVideoUpload: vi.fn(async () => undefined),
  uploadToAzureBlob: vi.fn(async () => undefined),
}));

import * as api from "@/lib/api";
import { MAX_UPLOAD_BYTES, checkCvFile, checkVideoFile, uploadMaterial } from "./uploads";

function file(name: string, type: string, size = 10): File {
  const f = new File(["x"], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
}

beforeEach(() => vi.clearAllMocks());

describe("file checks", () => {
  it("accepts a PDF CV and rejects other types", () => {
    expect(checkCvFile(file("cv.pdf", "application/pdf"))).toBeNull();
    expect(checkCvFile(file("cv.docx", "application/msword"))).toMatch(/PDF/);
  });

  it("accepts any video type and rejects the rest", () => {
    expect(checkVideoFile(file("a.mp4", "video/mp4"))).toBeNull();
    expect(checkVideoFile(file("a.webm", "video/webm"))).toBeNull();
    expect(checkVideoFile(file("a.pdf", "application/pdf"))).toMatch(/Video/);
  });

  it("rejects files over the limit but allows exactly the limit", () => {
    expect(checkCvFile(file("cv.pdf", "application/pdf", MAX_UPLOAD_BYTES))).toBeNull();
    expect(checkCvFile(file("cv.pdf", "application/pdf", MAX_UPLOAD_BYTES + 1))).toMatch(/20 MB/);
    expect(checkVideoFile(file("a.mp4", "video/mp4", MAX_UPLOAD_BYTES + 1))).toMatch(/20 MB/);
  });
});

describe("uploadMaterial", () => {
  it("uploads a CV to blob storage, then confirms it", async () => {
    const cv = file("cv.pdf", "application/pdf", 123);
    const progress = vi.fn();

    await uploadMaterial("cv", cv, progress);

    expect(api.getCvUploadUrl).toHaveBeenCalledWith("cv.pdf", "application/pdf", 123);
    expect(api.uploadToAzureBlob).toHaveBeenCalledWith("https://blob/cv", cv, progress);
    expect(api.confirmCvUpload).toHaveBeenCalledWith("cv.pdf", "cv-key", 123, "application/pdf");
    expect(api.confirmVideoUpload).not.toHaveBeenCalled();
  });

  it("uses the video endpoints for a video", async () => {
    const video = file("intro.mp4", "video/mp4", 456);

    await uploadMaterial("video", video);

    expect(api.getVideoUploadUrl).toHaveBeenCalledWith("intro.mp4", "video/mp4", 456);
    expect(api.confirmVideoUpload).toHaveBeenCalledWith("intro.mp4", "video-key", 456, "video/mp4");
    expect(api.confirmCvUpload).not.toHaveBeenCalled();
  });

  it("refuses a bad file before asking for an upload URL", async () => {
    await expect(uploadMaterial("cv", file("cv.png", "image/png"))).rejects.toThrow(/PDF/);
    expect(api.getCvUploadUrl).not.toHaveBeenCalled();
  });

  it("does not confirm when the upload itself fails", async () => {
    vi.mocked(api.uploadToAzureBlob).mockRejectedValueOnce(new Error("Network error during Azure upload"));

    await expect(uploadMaterial("cv", file("cv.pdf", "application/pdf"))).rejects.toThrow("Network error");
    expect(api.confirmCvUpload).not.toHaveBeenCalled();
  });
});
