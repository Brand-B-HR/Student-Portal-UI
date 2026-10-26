import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/http", () => ({
  authHeaders: vi.fn(async () => ({
    Authorization: "Bearer tok_test",
    "Content-Type": "application/json",
  })),
  optionalAuthHeaders: vi.fn(async () => ({})),
}));

import { ApiError } from "./api";
import {
  bookConsultation,
  cancelConsultation,
  dayKey,
  fetchEligibility,
  fetchMyConsultations,
  fetchSlots,
  groupSlotsByDay,
  isCancelled,
  topicLabel,
  type ConsultationSlot,
} from "./consultations";

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

function slot(id: number, startUtc: string): ConsultationSlot {
  return { id, startUtc, endUtc: startUtc, durationMinutes: 30 };
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("slot grouping", () => {
  it("groups by the day in the given zone, not by the UTC day", () => {
    // 20:00 UTC is already the next morning in Colombo (UTC+5:30)
    const slots = [slot(1, "2026-11-02T04:30:00Z"), slot(2, "2026-11-02T20:00:00Z")];

    expect(groupSlotsByDay(slots, "UTC").map((d) => d.key)).toEqual(["2026-11-02"]);
    expect(groupSlotsByDay(slots, "Asia/Colombo").map((d) => d.key)).toEqual(["2026-11-02", "2026-11-03"]);
  });

  it("sorts days and times ascending", () => {
    const days = groupSlotsByDay(
      [slot(3, "2026-11-03T05:00:00Z"), slot(2, "2026-11-02T06:00:00Z"), slot(1, "2026-11-02T05:00:00Z")],
      "UTC"
    );

    expect(days.map((d) => d.slots.map((s) => s.id))).toEqual([[1, 2], [3]]);
  });

  it("returns nothing for no slots", () => {
    expect(groupSlotsByDay([], "UTC")).toEqual([]);
  });

  it("formats the day key as yyyy-mm-dd", () => {
    expect(dayKey("2026-01-05T10:00:00Z", "UTC")).toBe("2026-01-05");
  });
});

describe("helpers", () => {
  it("labels topics and falls back to the raw value", () => {
    expect(topicLabel("cv_review")).toBe("CV review");
    expect(topicLabel("mystery")).toBe("mystery");
  });

  it("treats both cancel statuses as cancelled", () => {
    expect(isCancelled("cancelled_by_student")).toBe(true);
    expect(isCancelled("cancelled_by_staff")).toBe(true);
    expect(isCancelled("confirmed")).toBe(false);
  });
});

describe("fetchSlots", () => {
  it("calls the versioned student path with a token and unwraps the list", async () => {
    fetchMock.mockResolvedValue(json({ slots: [slot(1, "2026-11-02T05:00:00Z")] }));

    const slots = await fetchSlots(7);

    const { url, options } = lastCall();
    expect(url).toContain("/api/v1/student/consultants/7/slots");
    expect(options.headers).toMatchObject({ Authorization: "Bearer tok_test" });
    expect(slots).toHaveLength(1);
  });

  it("throws an ApiError carrying the status", async () => {
    fetchMock.mockResolvedValue(json({ message: "nope" }, { status: 403 }));

    await expect(fetchSlots(7)).rejects.toMatchObject({ status: 403, message: "nope" });
  });
});

describe("fetchEligibility", () => {
  it("returns the reason when blocked", async () => {
    fetchMock.mockResolvedValue(json({ canBook: false, reason: "no_cv" }));

    await expect(fetchEligibility()).resolves.toEqual({ canBook: false, reason: "no_cv" });
    expect(lastCall().url).toContain("/student/consultations/eligibility");
  });
});

describe("bookConsultation", () => {
  const request = { slotId: 4, topic: "cv_review" as const, studentTimeZone: "Asia/Colombo" };

  it("posts the booking", async () => {
    fetchMock.mockResolvedValue(json({ id: 9 }, { status: 201 }));

    await bookConsultation(request);

    const { url, options } = lastCall();
    expect(url).toMatch(/\/student\/consultations$/);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toEqual(request);
  });

  it("surfaces a taken slot as a 409 ApiError with the server message", async () => {
    fetchMock.mockResolvedValue(
      json({ message: "That time slot has just been taken. Please pick another one." }, { status: 409 })
    );

    const error = await bookConsultation(request).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, message: expect.stringContaining("just been taken") });
  });
});

describe("fetchMyConsultations", () => {
  it("passes the tab as the status filter", async () => {
    fetchMock.mockResolvedValue(json({ consultations: [], total: 0 }));

    await expect(fetchMyConsultations("past")).resolves.toEqual([]);
    expect(lastCall().url).toContain("status=past");
  });
});

describe("cancelConsultation", () => {
  it("patches the cancel endpoint with the reason", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await cancelConsultation(9, "clash");

    const { url, options } = lastCall();
    expect(url).toContain("/student/consultations/9/cancel");
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body as string)).toEqual({ reason: "clash" });
  });

  it("throws inside the cancellation window", async () => {
    fetchMock.mockResolvedValue(json({ message: "too late" }, { status: 422 }));

    await expect(cancelConsultation(9)).rejects.toMatchObject({ status: 422 });
  });
});
