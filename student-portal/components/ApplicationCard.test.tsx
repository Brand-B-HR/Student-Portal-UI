import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ApplicationCard from "./ApplicationCard";
import type { MyApplication } from "@/lib/jobs";

function make(overrides: Partial<MyApplication> = {}): MyApplication {
  return {
    id: "a-1",
    recruitmentId: "r-1",
    specification: "Software Engineer",
    companyName: "Acme",
    employmentType: "Permanent",
    appliedAt: "2026-10-20T08:00:00Z",
    hasCv: true,
    hasVideo: false,
    progress: "Applied",
    ...overrides,
  };
}

describe("ApplicationCard", () => {
  it("shows the job, the company, when it was sent and what was attached", () => {
    render(<ApplicationCard application={make()} />);

    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getAllByText(/Acme/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Applied 20 Oct 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Sent: CV$/)).toBeInTheDocument();
  });

  it.each([
    [{ hasCv: true, hasVideo: true }, /Sent: CV and intro video/],
    [{ hasCv: false, hasVideo: true }, /Sent: Intro video/],
  ])("describes what was sent (%j)", (attached, expected) => {
    render(<ApplicationCard application={make(attached)} />);

    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it.each([
    ["Applied", "Applied"],
    ["UnderReview", "Under review"],
    ["Shortlisted", "Shortlisted"],
    ["NotProgressing", "Not progressing"],
  ] as const)("shows %s as %s", (progress, label) => {
    render(<ApplicationCard application={make({ progress })} />);

    // The badge; the meta line also begins "Applied", so match the badge by exact text.
    expect(screen.getAllByText(label, { exact: true }).length).toBeGreaterThan(0);
  });

  it("is gentle about an application that isn't moving forward", () => {
    render(<ApplicationCard application={make({ progress: "NotProgressing" })} />);

    expect(screen.getByText("Not progressing")).toBeInTheDocument();
    expect(screen.getByText(/isn't moving forward/)).toBeInTheDocument();
    expect(screen.queryByText(/reject/i)).not.toBeInTheDocument();
  });

  it("prints nothing raw when the server sends a status it doesn't know", () => {
    render(<ApplicationCard application={make({ progress: "Rejected" as MyApplication["progress"] })} />);

    expect(screen.queryByText(/rejected/i)).not.toBeInTheDocument();
  });
});
