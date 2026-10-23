import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/uploads", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/uploads")>()),
  uploadMaterial: vi.fn(async () => undefined),
}));

import MaterialUpload from "./MaterialUpload";
import { uploadMaterial } from "@/lib/uploads";

beforeEach(() => vi.clearAllMocks());

describe("MaterialUpload", () => {
  it("uploads a chosen CV and tells the page", async () => {
    const onUploaded = vi.fn();
    render(<MaterialUpload onUploaded={onUploaded} />);

    const cv = new File(["x"], "cv.pdf", { type: "application/pdf" });
    await userEvent.upload(screen.getByLabelText("Upload your CV"), cv);

    await waitFor(() => expect(onUploaded).toHaveBeenCalledTimes(1));
    expect(uploadMaterial).toHaveBeenCalledWith("cv", cv, expect.any(Function));
  });

  it("uploads an intro video through the video path", async () => {
    render(<MaterialUpload onUploaded={vi.fn()} />);

    const video = new File(["x"], "intro.mp4", { type: "video/mp4" });
    await userEvent.upload(screen.getByLabelText("Upload an intro video"), video);

    await waitFor(() => expect(uploadMaterial).toHaveBeenCalledWith("video", video, expect.any(Function)));
  });

  it("shows why a wrong file type was refused and uploads nothing", async () => {
    const onUploaded = vi.fn();
    render(<MaterialUpload onUploaded={onUploaded} />);

    // applyAccept off so the file reaches the handler, as a drop would
    const user = userEvent.setup({ applyAccept: false });
    await user.upload(screen.getByLabelText("Upload your CV"), new File(["x"], "cv.png", { type: "image/png" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/PDF/);
    expect(uploadMaterial).not.toHaveBeenCalled();
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it("shows the error and stays put when the upload fails", async () => {
    vi.mocked(uploadMaterial).mockRejectedValueOnce(new Error("Azure upload failed (403)"));
    const onUploaded = vi.fn();
    render(<MaterialUpload onUploaded={onUploaded} />);

    await userEvent.upload(screen.getByLabelText("Upload your CV"), new File(["x"], "cv.pdf", { type: "application/pdf" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Azure upload failed (403)");
    expect(onUploaded).not.toHaveBeenCalled();
  });
});
