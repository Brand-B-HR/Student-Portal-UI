"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/firebase";
import { bootstrapStudentProfile } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        bootstrapStudentProfile()
          .catch(() => undefined)
          .finally(() => {
            router.replace("/dashboard");
          });
      }
    });

    return () => unsub();
  }, [router]);

  async function handleGoogleLogin() {
    setLoading(true);
    setError("");

    try {
      await signInWithGoogle();
      await bootstrapStudentProfile();
      router.replace("/dashboard");
    } catch (e: any) {
      setError(e.message ?? "Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailAuth() {
    setLoading(true);
    setError("");

    try {
      if (mode === "signup") {
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }

      await bootstrapStudentProfile();

      router.replace("/dashboard");
    } catch (e: any) {
      setError(e.message ?? "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const features = [
    "One active PDF CV per student",
    "Track status and reviewer notes in one place",
    "Balanced layouts on any device",
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-mint-50 p-4 sm:p-6">
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-[28px] bg-paper shadow-[0_30px_80px_-20px_rgba(15,46,31,0.35)] md:min-h-[620px] md:flex-row">
        {/* Brand / story panel */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-forest-900 to-forest-700 px-8 py-10 sm:px-10 sm:py-12 md:w-[42%]">
          {/* growth-ring signature */}
          <svg className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 opacity-40" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="90" stroke="#6cc796" strokeOpacity="0.25" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="68" stroke="#6cc796" strokeOpacity="0.3" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="46" stroke="#9ddcb9" strokeOpacity="0.35" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="24" stroke="#9ddcb9" strokeOpacity="0.4" strokeWidth="1.5" />
          </svg>
          <svg className="pointer-events-none absolute -bottom-16 -left-20 h-72 w-72 opacity-30" viewBox="0 0 200 200" fill="none">
            <circle cx="100" cy="100" r="90" stroke="#6cc796" strokeOpacity="0.2" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="60" stroke="#6cc796" strokeOpacity="0.25" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="30" stroke="#9ddcb9" strokeOpacity="0.3" strokeWidth="1.5" />
          </svg>

          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path
                    d="M12 3C9 7 7 10 7 13.5C7 16.5 9.2 19 12 19C14.8 19 17 16.5 17 13.5C17 10 15 7 12 3Z"
                    stroke="#9ddcb9"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                  <path d="M12 19V21" stroke="#9ddcb9" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </span>
              <span className="font-display text-[15px] font-semibold tracking-wide text-leaf-300">
                StudentCV Portal
              </span>
            </div>

            <h2 className="font-display mt-10 text-3xl font-semibold leading-[1.15] text-white sm:text-4xl">
              Upload once.
              <br />
              Grow with every review.
            </h2>
            <p className="mt-4 max-w-xs text-[15px] leading-6 text-mint-100/80">
              A calm, focused workspace built for students — no clutter, no guesswork.
            </p>
          </div>

          <ul className="relative z-10 mt-10 space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-[13.5px] text-mint-100/90">
                <svg viewBox="0 0 20 20" className="h-5 w-5 flex-shrink-0" fill="none">
                  <circle cx="10" cy="10" r="10" fill="rgba(255,255,255,0.12)" />
                  <path
                    d="M6 10.5L8.5 13L14 7.5"
                    stroke="#9ddcb9"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-12 sm:py-12">
          <div className="w-full max-w-sm">
            <h1 className="font-display text-2xl font-semibold text-forest-900 sm:text-[28px]">Welcome back</h1>
            <p className="mt-1.5 text-sm text-ink-600">Sign in with email or Google to continue.</p>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex gap-1 rounded-xl bg-mint-100 p-1">
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`flex-1 rounded-lg py-2 text-[13.5px] font-semibold transition ${
                  mode === "login" ? "bg-white text-forest-900 shadow-sm" : "text-ink-600 hover:text-forest-800"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-lg py-2 text-[13.5px] font-semibold transition ${
                  mode === "signup" ? "bg-white text-forest-900 shadow-sm" : "text-ink-600 hover:text-forest-800"
                }`}
              >
                Sign up
              </button>
            </div>

            <div className="mt-6 space-y-4 text-left">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-ink-600">
                  Email address
                </label>
                <div className="relative flex items-center">
                  <svg className="pointer-events-none absolute left-3.5 h-[18px] w-[18px] text-ink-400" viewBox="0 0 20 20" fill="none">
                    <rect x="2.5" y="4.5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M3 5.5L10 11L17 5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-mint-100 bg-mint-50/60 py-2.5 pr-3.5 pl-10 text-sm text-ink-900 outline-none transition focus:border-leaf-500 focus:bg-white focus:ring-2 focus:ring-leaf-100"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-ink-600">
                  Password
                </label>
                <div className="relative flex items-center">
                  <svg className="pointer-events-none absolute left-3.5 h-[18px] w-[18px] text-ink-400" viewBox="0 0 20 20" fill="none">
                    <rect x="4" y="9" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.4" />
                    <path d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-mint-100 bg-mint-50/60 py-2.5 pr-10 pl-10 text-sm text-ink-900 outline-none transition focus:border-leaf-500 focus:bg-white focus:ring-2 focus:ring-leaf-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-2.5 flex h-7 w-7 items-center justify-center rounded-md text-ink-400 transition hover:bg-mint-100 hover:text-forest-700"
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none">
                        <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        <path
                          d="M9.9 5.1a6.7 6.7 0 0 1 7.6 4.9c-.4 1-.9 1.8-1.6 2.5M6 6.6c-1.5 1-2.7 2.4-3.5 3.4a6.7 6.7 0 0 0 9 3.3"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none">
                        <path
                          d="M1.7 10S4.5 4.5 10 4.5 18.3 10 18.3 10 15.5 15.5 10 15.5 1.7 10 1.7 10Z"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinejoin="round"
                        />
                        <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.4" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEmailAuth}
                disabled={loading || !email || !password}
                className="w-full rounded-xl bg-leaf-600 py-3 text-sm font-semibold text-white transition hover:bg-forest-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Please wait…" : mode === "signup" ? "Create account" : "Continue"}
              </button>
            </div>

            <div className="my-6 flex items-center gap-3 text-[11px] font-medium tracking-wider text-ink-400 uppercase">
              <span className="h-px flex-1 bg-mint-100" /> or <span className="h-px flex-1 bg-mint-100" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-leaf-500 bg-white py-3 text-sm font-semibold text-forest-900 transition hover:bg-leaf-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="h-5 w-5" />
              {loading ? "Signing in…" : "Continue with Google"}
            </button>

            <p className="mt-8 text-center text-xs leading-5 text-ink-400">
              Use the same account to upload your CV, preview it, and read feedback from the dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}