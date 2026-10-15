import { beforeEach, describe, expect, it, vi } from "vitest";

// lib/http.ts imports this lazily, inside each function — vi.mock still
// intercepts, and mocking it is what keeps these tests from needing real
// Firebase config.
const mocks = vi.hoisted(() => ({
  auth: { currentUser: null as { uid: string } | null },
  getIdToken: vi.fn(),
}));

vi.mock("@/lib/firebase", () => mocks);

import { authHeaders, optionalAuthHeaders } from "./http";

beforeEach(() => {
  mocks.auth.currentUser = null;
  mocks.getIdToken.mockReset();
});

describe("authHeaders", () => {
  it("sends the bearer token and a JSON content type", async () => {
    mocks.getIdToken.mockResolvedValue("tok_123");
    expect(await authHeaders()).toEqual({
      Authorization: "Bearer tok_123",
      "Content-Type": "application/json",
    });
  });

  it("passes forceRefresh through", async () => {
    mocks.getIdToken.mockResolvedValue("tok_fresh");
    await authHeaders(true);
    expect(mocks.getIdToken).toHaveBeenCalledWith(true);
  });

  it("rejects when there is no session", async () => {
    mocks.getIdToken.mockRejectedValue(new Error("Not authenticated"));
    await expect(authHeaders()).rejects.toThrow();
  });
});

describe("optionalAuthHeaders", () => {
  it("returns no headers when signed out, without asking for a token", async () => {
    expect(await optionalAuthHeaders()).toEqual({});
    expect(mocks.getIdToken).not.toHaveBeenCalled();
  });

  it("returns the bearer token when signed in", async () => {
    mocks.auth.currentUser = { uid: "u1" };
    mocks.getIdToken.mockResolvedValue("tok_abc");
    expect(await optionalAuthHeaders()).toEqual({ Authorization: "Bearer tok_abc" });
  });

  it("falls back to anonymous rather than throwing when the token can't be minted", async () => {
    // The blog list must still render for this viewer — a dead token means
    // "treat me as a guest", not "fail the page".
    mocks.auth.currentUser = { uid: "u1" };
    mocks.getIdToken.mockRejectedValue(new Error("network"));
    expect(await optionalAuthHeaders()).toEqual({});
  });

  it("omits Content-Type, so it can't turn a GET into a preflighted request", async () => {
    mocks.auth.currentUser = { uid: "u1" };
    mocks.getIdToken.mockResolvedValue("tok_abc");
    expect(await optionalAuthHeaders()).not.toHaveProperty("Content-Type");
  });
});
