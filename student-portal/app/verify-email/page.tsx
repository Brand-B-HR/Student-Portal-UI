"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, onAuthStateChanged, refreshUser, resendVerificationEmail, signOut } from "@/lib/firebase";
import { bootstrapStudentProfile, bootstrapPayloadFromUser, ApiError } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { toast } from "react-toastify";

/** How often to re-check the verified flag while this page is in the foreground. */
const POLL_INTERVAL_MS = 3000;
/** Firebase rate-limits verification sends; hold the button to stay under it. */
const RESEND_COOLDOWN_S = 60;

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  // Verification can be detected by the poll, the tab regaining focus, or the
  // manual button all at once. This latch keeps those from racing into three
  // concurrent bootstrap calls and three redirects.
  const settled = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setEmail(user.email);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  /**
   * Returns true once the account is verified and the profile is bootstrapped.
   * `silent` is for the background checks — they shouldn't toast "still not
   * verified" at a user who is sitting on the page waiting, which is the
   * normal state here.
   */
  const checkVerified = useCallback(
    async (silent: boolean): Promise<boolean> => {
      if (settled.current) return true;
      const user = await refreshUser();
      if (!user) return false;
      if (!user.emailVerified) {
        if (!silent) toast.error("Still not verified. Please click the link in the email first.");
        return false;
      }
      settled.current = true;
      // Carries the sign-up name through: this is the call that actually
      // creates the student record, since the one at sign-up was still 403ing.
      await bootstrapStudentProfile(bootstrapPayloadFromUser(user));
      router.replace("/dashboard");
      return true;
    },
    [router]
  );

  // Watch for verification instead of waiting to be told about it. The link is
  // usually opened elsewhere — the mail client's browser, or a phone — so this
  // tab never hears about it otherwise. visibilitychange covers the common
  // case of verifying in another tab and switching straight back, which lands
  // well inside the poll interval.
  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (cancelled || settled.current || document.hidden) return;
      try {
        await checkVerified(true);
      } catch {
        // Transient — the next tick retries. Only the user-triggered path
        // surfaces errors, so a flaky network doesn't spray toasts.
      }
    }

    const id = setInterval(check, POLL_INTERVAL_MS);
    document.addEventListener("visibilitychange", check);
    check();

    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, [checkVerified]);

  async function handleResend() {
    setResending(true);
    try {
      await resendVerificationEmail();
      setCooldown(RESEND_COOLDOWN_S);
      toast.success("Verification email sent. Check your inbox.");
    } catch (e: unknown) {
      toast.error(errorMessage(e, "Couldn't send the email. Please try again."));
    } finally {
      setResending(false);
    }
  }

  async function handleContinue() {
    setChecking(true);
    try {
      await checkVerified(false);
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 403) {
        toast.error("Still not verified. Please click the link in the email first.");
      } else {
        toast.error(errorMessage(e, "Something went wrong. Please try again."));
      }
    } finally {
      setChecking(false);
    }
  }

  async function handleUseDifferentAccount() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mint-50 p-4 sm:p-6">
      <div className="w-full max-w-sm rounded-[28px] bg-paper p-8 text-center shadow-[0_30px_80px_-20px_rgba(15,46,31,0.35)]">
        <h1 className="font-display text-2xl font-semibold text-forest-900">Verify your email</h1>
        <p className="mt-3 text-sm leading-6 text-ink-600">
          We sent a verification link to{" "}
          <span className="font-semibold text-forest-800">{email ?? "your email address"}</span>. Click it and
          this page will continue on its own — no need to come back here.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2.5 text-[13px] font-medium text-ink-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-leaf-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-leaf-600" />
          </span>
          Waiting for verification…
        </div>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="mt-6 w-full rounded-xl border-2 border-leaf-500 bg-white py-3 text-sm font-semibold text-forest-900 transition hover:bg-leaf-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white disabled:hover:text-forest-900"
        >
          {resending
            ? "Sending…"
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend verification email"}
        </button>

        {/* Fallback for the rare case where polling can't see the change —
            e.g. the tab was backgrounded by the OS and timers were throttled. */}
        <button
          type="button"
          onClick={handleContinue}
          disabled={checking}
          className="mt-3 w-full rounded-xl py-2.5 text-[13px] font-semibold text-forest-800 transition hover:bg-mint-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checking ? "Checking…" : "Check now"}
        </button>

        <button
          type="button"
          onClick={handleUseDifferentAccount}
          className="mt-6 text-xs font-medium text-ink-400 underline-offset-2 hover:text-ink-600 hover:underline"
        >
          Use a different account
        </button>
      </div>
    </div>
  );
}
