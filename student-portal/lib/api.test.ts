import { beforeEach, describe, expect, it, vi } from "vitest";

// Stubbed so these tests exercise the request/response handling without
// reaching Firebase for a token.
vi.mock("@/lib/http", () => ({
  authHeaders: vi.fn(async () => ({
    Authorization: "Bearer tok_test",
    "Content-Type": "application/json",
  })),
  optionalAuthHeaders: vi.fn(async () => ({})),
}));

import {
  ApiError,
  deleteComment,
  fetchComments,
  likeArticle,
  postComment,
  saveArticle,
  unlikeArticle,
} from "./api";

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

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

describe("article reactions", () => {
  it("likes an article with a POST and returns the new count", async () => {
    fetchMock.mockResolvedValue(json({ liked: true, likeCount: 13 }));

    await expect(likeArticle("abc-123")).resolves.toEqual({ liked: true, likeCount: 13 });

    const { url, options } = lastCall();
    expect(url).toContain("/api/v1/student/articles/abc-123/like");
    expect(options.method).toBe("POST");
    // The API takes no body for a toggle; sending one would be a 400 risk.
    expect(options.body).toBeUndefined();
  });

  it("unlikes with a DELETE on the same path", async () => {
    fetchMock.mockResolvedValue(json({ liked: false, likeCount: 12 }));

    await unlikeArticle("abc-123");

    const { url, options } = lastCall();
    expect(url).toContain("/api/v1/student/articles/abc-123/like");
    expect(options.method).toBe("DELETE");
  });

  it("saves an article", async () => {
    fetchMock.mockResolvedValue(json({ saved: true }));
    await expect(saveArticle("abc-123")).resolves.toEqual({ saved: true });
    expect(lastCall().url).toContain("/api/v1/student/articles/abc-123/save");
  });

  it("sends the auth header", async () => {
    fetchMock.mockResolvedValue(json({ liked: true, likeCount: 1 }));
    await likeArticle("abc-123");
    expect(lastCall().options.headers).toMatchObject({ Authorization: "Bearer tok_test" });
  });
});

describe("comments", () => {
  it("posts the body as JSON and returns the created comment", async () => {
    const created = {
      id: "7",
      authorName: "Nimal",
      body: "Useful.",
      createdAt: "2026-10-15T09:00:00Z",
      likes: 0,
      likedByMe: false,
      isMine: true,
    };
    // The API answers 201; the client keys off res.ok, not the exact code.
    fetchMock.mockResolvedValue(json(created, { status: 201 }));

    await expect(postComment("abc-123", "Useful.")).resolves.toEqual(created);

    const { url, options } = lastCall();
    expect(url).toContain("/api/v1/student/articles/abc-123/comments");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body as string)).toEqual({ body: "Useful." });
  });

  it("defaults a missing list payload instead of returning undefined", async () => {
    fetchMock.mockResolvedValue(json({}));
    await expect(fetchComments("abc-123")).resolves.toEqual({ comments: [], total: 0 });
  });

  it("passes pagination through", async () => {
    fetchMock.mockResolvedValue(json({ comments: [], total: 0 }));
    await fetchComments("abc-123", 2, 50);
    expect(lastCall().url).toContain("page=2&pageSize=50");
  });

  it("resolves on a 204 without trying to parse a body", async () => {
    // A real 204 has no body, so calling res.json() on it throws — this is the
    // regression guard for that.
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(deleteComment("7")).resolves.toBeUndefined();
    expect(lastCall().options.method).toBe("DELETE");
  });
});

describe("error handling", () => {
  it("throws ApiError carrying the server's message", async () => {
    fetchMock.mockResolvedValue(
      json({ message: "A comment cannot be longer than 1000 characters." }, { status: 400 })
    );

    await expect(postComment("abc-123", "x")).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "A comment cannot be longer than 1000 characters.",
    });
  });

  it("reads Retry-After off a 429 so the composer can count down", async () => {
    fetchMock.mockResolvedValue(
      json({ message: "Too many comments. Try again shortly." }, {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "42" },
      })
    );

    await expect(postComment("abc-123", "x")).rejects.toMatchObject({
      status: 429,
      retryAfterSeconds: 42,
    });
  });

  it("leaves retryAfterSeconds unset when there is no Retry-After header", async () => {
    fetchMock.mockResolvedValue(json({ message: "Nope." }, { status: 404 }));

    const err = await deleteComment("7").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).retryAfterSeconds).toBeUndefined();
  });

  it("falls back to a readable message when the body isn't JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>502</html>", { status: 502 }));

    await expect(likeArticle("abc-123")).rejects.toMatchObject({
      status: 502,
      message: "Couldn't like this article.",
    });
  });
});
