import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/http", () => ({
  authHeaders: vi.fn(async () => ({
    Authorization: "Bearer tok_test",
    "Content-Type": "application/json",
  })),
  optionalAuthHeaders: vi.fn(async () => ({})),
}));

import { ApiError } from "./api";
import { fetchJobs, fetchMyApplications, type MyApplication } from "./jobs";

const fetchMock = vi.fn();

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function lastCall() {
  const [url, options] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return { url, options };
}

const application: MyApplication = {
  id: "a-1",
  recruitmentId: "r-1",
  specification: "Software Engineer",
  companyName: "Acme",
  employmentType: "Permanent",
  appliedAt: "2026-10-20T08:00:00Z",
  hasCv: true,
  hasVideo: false,
  progress: "UnderReview",
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("fetchMyApplications", () => {
  it("calls the signed-in student endpoint with the student's token", async () => {
    fetchMock.mockResolvedValue(json([application]));

    await expect(fetchMyApplications()).resolves.toEqual([application]);

    const { url, options } = lastCall();
    expect(url).toMatch(/\/api\/v1\/student\/jobs\/applications$/);
    expect((options.headers as Record<string, string>).Authorization).toBe("Bearer tok_test");
  });

  it("works whether or not the page wants the global loading overlay", async () => {
    fetchMock.mockImplementation(async () => json([]));

    await expect(fetchMyApplications(undefined, false)).resolves.toEqual([]);
    await expect(fetchMyApplications(undefined, true)).resolves.toEqual([]);
  });

  it("raises an ApiError carrying the server's message", async () => {
    fetchMock.mockImplementation(async () => json({ message: "Please verify your email first." }, { status: 403 }));

    await expect(fetchMyApplications()).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      message: "Please verify your email first.",
    });
    await expect(fetchMyApplications()).rejects.toBeInstanceOf(ApiError);
  });
});

describe("fetchJobs", () => {
  it("sends only the filters that are set", async () => {
    fetchMock.mockResolvedValue(json({ jobs: [], companies: [], specifications: [] }));

    await fetchJobs({ companyId: "c-1", specification: "" });

    expect(lastCall().url).toMatch(/\/api\/v1\/jobs\?companyId=c-1$/);
  });

  it("fills in missing lists", async () => {
    fetchMock.mockResolvedValue(json({}));

    await expect(fetchJobs()).resolves.toEqual({ jobs: [], companies: [], specifications: [] });
  });
});
