/**
 * Single source of truth for the backend API base URL.
 *
 * `NEXT_PUBLIC_*` values are inlined into the JS bundle at build time, not read at
 * container startup — so dev/UAT/prod can't share one build artifact. Each
 * environment's CI/CD pipeline must set NEXT_PUBLIC_API_URL before `next build` runs
 * (locally, `.env.local` covers this — see README.md#environment-variables).
 */
function resolveApiBaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL;
  if (value) return value;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Configure it in this environment's build " +
        "pipeline (dev/UAT/prod each need their own value) — see README.md#environment-variables."
    );
  }

  // Local dev fallback only, so `npm run dev` works without a .env.local present.
  return "http://localhost:5033";
}

export const API_BASE_URL = resolveApiBaseUrl();
