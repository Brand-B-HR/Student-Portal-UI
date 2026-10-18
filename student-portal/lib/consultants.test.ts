import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchConsultant, fetchConsultants, type Consultant } from "./consultants";

const fetchMock = vi.fn();

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

/** The URL and options the single fetch call was made with. */
function lastCall() {
  const [url, options] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return { url, options };
}

const alice: Consultant = {
  id: 7,
  fullName: "Alice Fernando",
  title: "Senior Recruiter",
  specialties: ["CV review"],
  isAcceptingBookings: true,
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("fetchConsultants", () => {
  it("unwraps the list envelope and calls the versioned public path", async () => {
    fetchMock.mockResolvedValue(json({ consultants: [alice] }));

    await expect(fetchConsultants()).resolves.toEqual([alice]);

    const { url, options } = lastCall();
    expect(url).toContain("/api/v1/consultants");
    // The endpoint is AllowAnonymous — sending a token would be pointless work
    // and would defeat the server's shared output cache.
    expect(options?.headers).toBeUndefined();
  });

  it("returns an empty list when the envelope has no consultants key", async () => {
    fetchMock.mockResolvedValue(json({}));

    await expect(fetchConsultants()).resolves.toEqual([]);
  });

  it("throws on a non-OK response so the page can show its error state", async () => {
    fetchMock.mockResolvedValue(json({ message: "boom" }, { status: 500 }));

    await expect(fetchConsultants()).rejects.toThrow("500");
  });
});

describe("fetchConsultant", () => {
  it("fetches one consultant by id", async () => {
    fetchMock.mockResolvedValue(json(alice));

    await expect(fetchConsultant(7)).resolves.toEqual(alice);
    expect(lastCall().url).toContain("/api/v1/consultants/7");
  });

  it("distinguishes a removed or unknown consultant from a generic failure", async () => {
    fetchMock.mockResolvedValue(json({ message: "gone" }, { status: 404 }));

    await expect(fetchConsultant(99)).rejects.toThrow("not_found");
  });
});
