"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { applyEmailActionCode, auth, refreshUser } from "@/lib/firebase";
import { bootstrapStudentProfile, bootstrapPayloadFromUser } from "@/lib/api";

export default function AuthActionPage() {
  // useSearchParams() needs a Suspense boundary around it, or the whole page
  // bails out of static rendering at build time.
  return (
    <Suspense fallback={<Shell>Verifying your email…</Shell>}>
      <AuthAction />
    </Suspense>
  );
}

type State =
  | { kind: "working" }
  | { kind: "verified-signed-out" }
  | { kind: "failed"; message: string };

function AuthAction() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>({ kind: "working" });
  // An action code is single-use, so React StrictMode's double-invoke in dev
  // would spend it on the first run and fail the second with
  // auth/invalid-action-code — making a good link look expired.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const mode = searchParams.get("mode");
    const oobCode = searchParams.get("oobCode");

    async function run() {
      if (mode !== "verifyEmail") {
        setState({
          kind: "failed",
          message: "This link isn't one we can handle. Please sign in and try again.",
        });
        return;
      }
      if (!oobCode) {
        setState({ kind: "failed", message: "This link is missing its verification code." });
        return;
      }

      try {
        await applyEmailActionCode(oobCode);
      } catch {
        // Firebase returns the same error for consumed, expired and malformed
        // codes, and a consumed code is the likely case for anyone clicking a
        // link twice — so don't claim it failed outright.
        setState({
          kind: "failed",
          message:
            "This link has expired or was already used. Sign in to send yourself a fresh one.",
        });
        return;
      }

      // Signed out in this browser — the account is verified, but there's no
      // session here to carry into the app.
      if (!auth.currentUser) {
        setState({ kind: "verified-signed-out" });
        return;
      }

      try {
        // Picks up the new emailVerified flag and mints a token that carries
        // it, which is what the backend gates on.
        const user = await refreshUser();
        await bootstrapStudentProfile(user ? bootstrapPayloadFromUser(user) : {});
        router.replace("/dashboard");
      } catch {
        // Verification itself worked; only the profile hand-off didn't. Send
        // them to /verify-email, which polls and retries on its own.
        router.replace("/verify-email");
      }
    }

    run();
  }, [router, searchParams]);

  if (state.kind === "working") {
    return <Shell>Verifying your email…</Shell>;
  }

  if (state.kind === "verified-signed-out") {
    return (
      <Shell title="Email verified">
        Your email address is confirmed. Sign in to pick up where you left off.
        <SignInLink label="Sign in" />
      </Shell>
    );
  }

  return (
    <Shell title="Couldn't verify this link">
      {state.message}
      <SignInLink label="Go to sign in" />
    </Shell>
  );
}

function SignInLink({ label }: { label: string }) {
  return (
    <Link
      href="/login"
      className="mt-7 block w-full rounded-xl bg-leaf-600 py-3 text-sm font-semibold text-white transition hover:bg-forest-700"
    >
      {label}
    </Link>
  );
}

function Shell({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mint-50 p-4 sm:p-6">
      <div className="w-full max-w-sm rounded-[28px] bg-paper p-8 text-center shadow-[0_30px_80px_-20px_rgba(15,46,31,0.35)]">
        <h1 className="font-display text-2xl font-semibold text-forest-900">
          {title ?? "Just a moment"}
        </h1>
        <div className="mt-3 text-sm leading-6 text-ink-600">{children}</div>
      </div>
    </div>
  );
}
