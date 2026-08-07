"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, onAuthStateChanged, refreshUser, resendVerificationEmail, signOut } from "@/lib/firebase";
import { bootstrapStudentProfile, getActiveCv, ApiError } from "@/lib/api";
import { toast } from "react-toastify";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

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

  async function handleResend() {
    setResending(true);
    try {
      await resendVerificationEmail();
      toast.success("Verification email sent. Check your inbox.");
    } catch (e: unknown) {
      toast.error((e as Error).message ?? "Couldn't send the email. Please try again.");
    } finally {
      setResending(false);
    }
  }

  async function handleContinue() {
    setChecking(true);
    try {
      const user = await refreshUser();
      if (!user?.emailVerified) {
        toast.error("Still not verified. Please click the link in the email first.");
        return;
      }
      await bootstrapStudentProfile();
      const activeCv = await getActiveCv();
      router.replace(activeCv ? "/dashboard" : "/upload");
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 403) {
        toast.error("Still not verified. Please click the link in the email first.");
      } else {
        toast.error((e as Error).message ?? "Something went wrong. Please try again.");
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
          <span className="font-semibold text-forest-800">{email ?? "your email address"}</span>. Click it, then
          come back here to continue.
        </p>

        <button
          type="button"
          onClick={handleContinue}
          disabled={checking}
          className="mt-8 w-full rounded-xl bg-leaf-600 py-3 text-sm font-semibold text-white transition hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checking ? "Checking…" : "I've verified — Continue"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="mt-3 w-full rounded-xl border-2 border-leaf-500 bg-white py-3 text-sm font-semibold text-forest-900 transition hover:bg-leaf-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {resending ? "Sending…" : "Resend verification email"}
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
