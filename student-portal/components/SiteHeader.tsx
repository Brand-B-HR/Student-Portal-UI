"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth, signOut, onAuthStateChanged } from "@/lib/firebase";
import type { User } from "@/lib/firebase";
import { initialsOf } from "@/lib/articles";

// "/jobs" (app/jobs/page.tsx) is a coming-soon stub with no real data yet —
// left out of primary nav until there's something to show. The page itself
// still exists for direct/future linking.
const NAV = [
  { href: "/dashboard", label: "Home" },
  { href: "/blog", label: "Articles" },
  { href: "/profile", label: "Profile" },
];

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/dashboard" className="flex flex-shrink-0 items-center gap-2.5">
      <img
        src="/logo.png"
        alt=""
        className={`rounded-[9px] object-contain ${compact ? "h-8 w-8" : "h-9 w-9"}`}
      />
      <span
        className={`font-serif font-semibold tracking-[-0.02em] text-ink-900 ${
          compact ? "text-[17px]" : "text-[19px]"
        }`}
      >
        CareerBuild
      </span>
    </Link>
  );
}

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  // Close the account menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Route change closes any open overlay.
  useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  const displayName = user?.displayName ?? user?.email ?? "Student";
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-5 sm:px-6 lg:px-8">

          {/* Mobile: menu trigger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="-ml-1.5 flex h-9 w-9 items-center justify-center rounded-lg text-ink-700 transition-colors hover:bg-brand-100 md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[2]">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <Wordmark />

          {/* Desktop nav — underline indicator, no boxy pills */}
          <nav className="hidden flex-1 items-center gap-7 md:flex">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative py-5 text-sm transition-colors ${
                    active
                      ? "font-semibold text-ink-900"
                      : "font-medium text-ink-500 hover:text-ink-900"
                  }`}
                >
                  {item.label}
                  <span
                    className={`absolute inset-x-0 -bottom-px h-[2.5px] rounded-full bg-brand-500 transition-opacity ${
                      active ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Account */}
          <div className="ml-auto flex items-center gap-2 md:ml-0" ref={menuRef}>
            <Link
              href="/upload"
              className="hidden rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-600 sm:inline-flex"
            >
              Update CV
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Account menu"
                className="flex items-center gap-2 rounded-full p-0.5 transition-shadow hover:ring-2 hover:ring-brand-200"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover ring-1 ring-line-strong"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700 ring-1 ring-brand-200">
                    {initialsOf(displayName)}
                  </span>
                )}
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="animate-fade-in absolute right-0 top-[calc(100%+10px)] w-60 overflow-hidden rounded-[14px] border border-line bg-white shadow-[var(--shadow-pop)]"
                >
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink-900">
                      {user?.displayName ?? "Student"}
                    </p>
                    <p className="truncate text-xs text-ink-400">{user?.email}</p>
                  </div>

                  <div className="p-1.5">
                    <Link
                      href="/profile"
                      role="menuitem"
                      className="block rounded-lg px-2.5 py-2 text-sm text-ink-700 transition-colors hover:bg-surface-subtle"
                    >
                      My CV &amp; Profile
                    </Link>
                    <Link
                      href="/upload"
                      role="menuitem"
                      className="block rounded-lg px-2.5 py-2 text-sm text-ink-700 transition-colors hover:bg-surface-subtle"
                    >
                      Update CV
                    </Link>
                  </div>

                  <div className="border-t border-line p-1.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleSignOut}
                      className="w-full rounded-lg px-2.5 py-2 text-left text-sm font-medium text-ink-700 transition-colors hover:bg-red-50 hover:text-red-700"
                    >
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-[2px]"
            onClick={() => setDrawerOpen(false)}
          />

          <div className="animate-fade-in absolute inset-y-0 left-0 flex w-[280px] flex-col bg-white shadow-[var(--shadow-pop)]">
            <div className="flex h-16 items-center justify-between border-b border-line px-5">
              <Wordmark compact />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-surface-subtle"
              >
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 fill-none stroke-current stroke-[2]">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-0.5 p-3">
              {NAV.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-[10px] px-3.5 py-3 text-[15px] transition-colors ${
                      active
                        ? "bg-brand-100 font-semibold text-brand-800"
                        : "font-medium text-ink-600 hover:bg-surface-subtle"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-line p-3">
              <Link
                href="/upload"
                className="mb-2 flex items-center justify-center rounded-full bg-brand-500 px-4 py-2.5 text-sm font-bold text-white"
              >
                Update CV
              </Link>
              <div className="flex items-center gap-2.5 px-1 py-2">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                    {initialsOf(displayName)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-ink-900">
                    {user?.displayName ?? "Student"}
                  </p>
                  <p className="truncate text-[11px] text-ink-400">{user?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full rounded-lg px-1 py-2 text-left text-sm font-medium text-ink-600 transition-colors hover:text-red-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
