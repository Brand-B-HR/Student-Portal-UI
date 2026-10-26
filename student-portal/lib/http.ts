/**
 * Auth headers for API calls.
 *
 * Firebase is imported lazily inside each function on purpose. lib/firebase.ts
 * calls getAuth() at module scope, which throws without a real API key — so a
 * static import here would make every module that reaches this one, including
 * the pure helpers in lib/articles.ts, unimportable in tests. Both functions
 * are already async, so the dynamic import costs nothing at the call site and
 * the module is cached after the first one.
 */

/**
 * Headers for an endpoint that requires a signed-in student.
 *
 * Throws when there's no session, which is what the caller wants: these
 * endpoints have nothing useful to return to an anonymous caller.
 */
export async function authHeaders(forceRefresh = false): Promise<Record<string, string>> {
  const { getIdToken } = await import("@/lib/firebase");
  const token = await getIdToken(forceRefresh);
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Headers for an endpoint that serves anonymous callers but fills in
 * viewer-specific fields when a token is present.
 *
 * The blog list and article reader are public and must stay that way, but they
 * carry likedByMe / savedByMe — which come back false unless the request is
 * authenticated. Hence "optional": never throws, because a missing or
 * unrefreshable token means "treat me as a guest", not "fail the request".
 */
export async function optionalAuthHeaders(): Promise<Record<string, string>> {
  try {
    const { auth, getIdToken } = await import("@/lib/firebase");
    if (!auth.currentUser) return {};
    return { Authorization: `Bearer ${await getIdToken()}` };
  } catch {
    return {};
  }
}
