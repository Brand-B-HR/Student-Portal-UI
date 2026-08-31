import { describe, expect, it } from "vitest";
import { errorMessage, isErrorLike } from "./errors";

describe("isErrorLike", () => {
  it("is true for an Error instance", () => {
    expect(isErrorLike(new Error("boom"))).toBe(true);
  });

  it("is false for a non-Error value", () => {
    expect(isErrorLike("boom")).toBe(false);
    expect(isErrorLike(null)).toBe(false);
  });
});

describe("errorMessage", () => {
  it("returns the Error's message", () => {
    expect(errorMessage(new Error("boom"), "fallback")).toBe("boom");
  });

  it("returns the fallback for a non-Error value", () => {
    expect(errorMessage("not an error", "fallback")).toBe("fallback");
  });

  it("returns the fallback for an Error with an empty message", () => {
    expect(errorMessage(new Error(""), "fallback")).toBe("fallback");
  });
});
