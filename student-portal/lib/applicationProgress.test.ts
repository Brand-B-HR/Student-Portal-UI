import { describe, expect, it } from "vitest";

import { progressCopy } from "./applicationProgress";

describe("progressCopy", () => {
  it.each([
    ["Applied", "Applied"],
    ["UnderReview", "Under review"],
    ["Shortlisted", "Shortlisted"],
    ["NotProgressing", "Not progressing"],
  ])("labels %s as %s", (progress, label) => {
    expect(progressCopy(progress).label).toBe(label);
  });

  it("never uses the word rejected, in any label or description", () => {
    for (const progress of ["Applied", "UnderReview", "Shortlisted", "NotProgressing"]) {
      const copy = progressCopy(progress);
      expect(copy.label).not.toMatch(/reject/i);
      expect(copy.description("Acme")).not.toMatch(/reject/i);
    }
  });

  it("names the company where that helps", () => {
    expect(progressCopy("Applied").description("Acme")).toContain("Acme");
    expect(progressCopy("Shortlisted").description("Acme")).toContain("Acme");
  });

  it("reads an unrecognised value as plain Applied rather than printing it", () => {
    for (const unknown of ["Rejected", "SomethingNew", ""]) {
      expect(progressCopy(unknown).label).toBe("Applied");
    }
  });
});
