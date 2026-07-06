"use client";
import { useEffect, useState } from "react";
import { auth, signOut } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const user = auth.currentUser;
  const [hasCv, setHasCv] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("mock_student_profile");
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed?.currentCv?.fileName) {
            setHasCv(true);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  async function handleSignOut() {
    await signOut(auth);
    router.replace("/login");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-leaf-200/70 bg-white/85 px-4 py-3 shadow-[0_12px_40px_-30px_rgba(15,46,31,0.45)] backdrop-blur-xl sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest-900 text-xl text-white shadow-sm">🎓</span>
            <div>
              <div className="text-sm font-semibold tracking-tight text-forest-900 sm:text-base">StudentCV Portal</div>
              <div className="text-xs text-ink-400">Upload, review, and track your CV</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-600 sm:gap-3">
          <Link href="/dashboard" className="rounded-2xl border border-leaf-200 bg-white px-3 py-2 transition hover:border-leaf-400 hover:bg-mint-50 hover:text-forest-900">
            Dashboard
          </Link>
          <Link href="/profile" className="rounded-2xl border border-leaf-200 bg-white px-3 py-2 transition hover:border-leaf-400 hover:bg-mint-50 hover:text-forest-900">
            My CV & Profile
          </Link>
          {!hasCv && (
            <Link href="/upload" className="rounded-2xl border border-leaf-200 bg-white px-3 py-2 transition hover:border-leaf-400 hover:bg-mint-50 hover:text-forest-900">
              Upload CV
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-leaf-100 bg-mint-50 px-3 py-2">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="h-9 w-9 rounded-full object-cover ring-2 ring-leaf-400/50" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf-100 text-sm font-semibold text-forest-800">
                {user?.displayName?.[0] ?? user?.email?.[0] ?? "S"}
              </div>
            )}
            <span className="min-w-0 truncate text-sm text-forest-900">{user?.displayName ?? user?.email ?? "Signed in"}</span>
          </div>

          <button
            onClick={handleSignOut}
            className="rounded-2xl bg-leaf-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-forest-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
}