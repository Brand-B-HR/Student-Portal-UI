import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConsultationCard from "./ConsultationCard";
import type { Consultation } from "@/lib/consultations";

function make(overrides: Partial<Consultation> = {}): Consultation {
  return {
    id: 5,
    status: "confirmed",
    consultant: { id: 1, fullName: "Jane Perera", title: "Senior Recruiter" },
    startUtc: "2030-11-02T05:00:00Z",
    endUtc: "2030-11-02T05:30:00Z",
    durationMinutes: 30,
    topic: "cv_review",
    meetingUrl: null,
    canCancel: true,
    cancelDeadlineUtc: "2030-11-02T01:00:00Z",
    ...overrides,
  };
}

function renderCard(consultation: Consultation, onCancel = vi.fn()) {
  render(<ConsultationCard consultation={consultation} timeZone="UTC" cancelling={false} onCancel={onCancel} />);
  return onCancel;
}

describe("ConsultationCard", () => {
  it("shows the consultant, topic and a placeholder until the meeting link exists", () => {
    renderCard(make());

    expect(screen.getByText("Jane Perera")).toBeInTheDocument();
    expect(screen.getByText(/Topic: CV review/)).toBeInTheDocument();
    expect(screen.getByText(/meeting link will appear here/i)).toBeInTheDocument();
  });

  it("links to the meeting once an admin has added it", () => {
    renderCard(make({ meetingUrl: "https://meet.example.com/abc" }));

    expect(screen.getByRole("link", { name: "Join meeting" })).toHaveAttribute(
      "href",
      "https://meet.example.com/abc"
    );
  });

  it("asks for confirmation before cancelling and passes the reason", async () => {
    const onCancel = renderCard(make());

    await userEvent.click(screen.getByRole("button", { name: "Cancel session" }));
    expect(onCancel).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText(/reason/i), "clash");
    await userEvent.click(screen.getByRole("button", { name: "Yes, cancel it" }));

    expect(onCancel).toHaveBeenCalledWith(5, "clash");
  });

  it("lets the student back out of cancelling", async () => {
    renderCard(make());

    await userEvent.click(screen.getByRole("button", { name: "Cancel session" }));
    await userEvent.click(screen.getByRole("button", { name: "Keep it" }));

    expect(screen.getByRole("button", { name: "Cancel session" })).toBeInTheDocument();
  });

  it("explains when the cancellation window has closed", () => {
    renderCard(make({ canCancel: false }));

    expect(screen.queryByRole("button", { name: "Cancel session" })).not.toBeInTheDocument();
    expect(screen.getByText(/can no longer be cancelled online/i)).toBeInTheDocument();
  });

  it("offers no actions on a cancelled session", () => {
    renderCard(make({ status: "cancelled_by_student", canCancel: false, cancellationReason: "clash" }));

    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.getByText(/Reason: clash/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel session" })).not.toBeInTheDocument();
  });
});
