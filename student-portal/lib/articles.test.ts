import { describe, expect, it } from "vitest";
import { sortByRecency, type Article } from "./articles";

function article(id: string, dates: { publishedAt?: string; createdAt: string }): Article {
  return { id, title: id, contentHtml: "", ...dates };
}

describe("sortByRecency", () => {
  it("puts the newest article first", () => {
    const list = [
      article("old", { createdAt: "2026-01-01T00:00:00Z" }),
      article("new", { createdAt: "2026-06-01T00:00:00Z" }),
      article("mid", { createdAt: "2026-03-01T00:00:00Z" }),
    ];
    expect(sortByRecency(list).map((a) => a.id)).toEqual(["new", "mid", "old"]);
  });

  it("prefers publishedAt over createdAt", () => {
    // Written first but published last — recency means published, not drafted.
    const list = [
      article("drafted-early", {
        createdAt: "2026-01-01T00:00:00Z",
        publishedAt: "2026-09-01T00:00:00Z",
      }),
      article("drafted-late", {
        createdAt: "2026-08-01T00:00:00Z",
        publishedAt: "2026-08-02T00:00:00Z",
      }),
    ];
    expect(sortByRecency(list).map((a) => a.id)).toEqual(["drafted-early", "drafted-late"]);
  });

  it("falls back to createdAt when publishedAt is missing", () => {
    const list = [
      article("unpublished", { createdAt: "2026-07-01T00:00:00Z" }),
      article("published", {
        createdAt: "2026-01-01T00:00:00Z",
        publishedAt: "2026-02-01T00:00:00Z",
      }),
    ];
    expect(sortByRecency(list).map((a) => a.id)).toEqual(["unpublished", "published"]);
  });

  it("leaves the caller's array untouched", () => {
    const list = [
      article("a", { createdAt: "2026-01-01T00:00:00Z" }),
      article("b", { createdAt: "2026-06-01T00:00:00Z" }),
    ];
    sortByRecency(list);
    expect(list.map((a) => a.id)).toEqual(["a", "b"]);
  });
});
