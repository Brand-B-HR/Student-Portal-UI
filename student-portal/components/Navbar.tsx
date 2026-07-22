"use client";
import { useEffect, useState } from "react";
import { auth, signOut, onAuthStateChanged } from "@/lib/firebase";
import type { User } from "@/lib/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-leaf-200/70 bg-[#ffffff] px-4 py-3 shadow-[0_12px_40px_-30px_rgba(15,46,31,0.45)] backdrop-blur-xl sm:px-6">
      
      {/* Desktop Navbar Layout (Hidden on Mobile) */}
      <div className="hidden lg:flex mx-auto max-w-6xl items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest-900 text-xl text-white shadow-sm">🎓</span>
          <div>
            <div className="text-sm font-semibold tracking-tight text-forest-900 sm:text-base">StudentCV Portal</div>
            <div className="text-xs text-ink-400">Upload, review, and track your CV</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-ink-600 sm:gap-3">
          <Link href="/dashboard" className="rounded-2xl border border-leaf-200 bg-white px-3 py-2 transition hover:border-leaf-400 hover:bg-mint-50 hover:text-forest-900">
            Dashboard
          </Link>
          <Link href="/dashboard#blogs" className="rounded-2xl border border-leaf-200 bg-white px-3 py-2 transition hover:border-leaf-400 hover:bg-mint-50 hover:text-forest-900">
            Articles
          </Link>
          <Link href="/profile" className="rounded-2xl border border-leaf-200 bg-white px-3 py-2 transition hover:border-leaf-400 hover:bg-mint-50 hover:text-forest-900">
            My CV & Profile
          </Link>
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
            className="rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile Navbar Layout (Hidden on Desktop) */}
      <div className="lg:hidden flex items-center justify-between w-full">
        {/* Left corner: Side Navigation menu trigger */}
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-forest-900 hover:bg-orange-100 rounded-xl transition duration-200 focus:outline-none"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Center: Brand Name */}
        <div className="flex items-center gap-2">
          <span className="text-lg">🎓</span>
          <span className="font-display font-semibold tracking-tight text-forest-900 text-base">
            StudentCV Portal
          </span>
        </div>

        {/* Right corner: Profile Dropdown Toggle */}
        <div className="relative">
          <button 
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} 
            className="focus:outline-none flex items-center"
          >
            {user?.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="h-8.5 w-8.5 rounded-full object-cover ring-2 ring-leaf-400/50 hover:ring-leaf-500 transition duration-200" />
            ) : (
              <div className="flex h-8.5 w-8.5 items-center justify-center rounded-full bg-leaf-100 text-xs font-semibold text-forest-800 ring-2 ring-leaf-400/50 hover:ring-leaf-500 transition duration-200">
                {user?.displayName?.[0] ?? user?.email?.[0] ?? "S"}
              </div>
            )}
          </button>

          {/* Profile Dropdown Popup (Logout) */}
          {profileDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
              <div 
                style={{ backgroundColor: '#ffffff' }}
                className="absolute right-0 mt-2 w-48 rounded-2xl border border-leaf-100 p-2.5 shadow-[0_12px_30px_-5px_rgba(45,19,5,0.15)] z-50 animate-fade-in"
              >
                <div className="px-2.5 py-1.5 border-b border-orange-50 mb-1.5">
                  <p className="text-[10px] text-ink-400 font-bold uppercase tracking-wider">Account</p>
                  <p className="text-xs text-forest-900 font-semibold truncate mt-0.5">{user?.displayName ?? user?.email ?? "Student"}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left rounded-xl bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 text-xs font-bold transition duration-200"
                >
                  🚪 Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Drawer Slide-out Sidebar Overlay */}
      {sidebarOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
          
          {/* Drawer Body */}
          <div 
            style={{ backgroundColor: '#ffffff' }}
            className="fixed top-0 left-0 bottom-0 z-50 w-64 shadow-2xl p-5 flex flex-col justify-between border-r border-orange-200 h-full"
          >
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-orange-50">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎓</span>
                  <span className="font-display font-semibold text-forest-900 text-base">StudentCV Portal</span>
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)} 
                  className="p-1.5 text-ink-600 hover:bg-orange-100 rounded-xl transition duration-200"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Drawer Links - Row by Row */}
              <div className="flex flex-col gap-2">
                <Link
                  href="/dashboard"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl bg-orange-50/50 hover:bg-orange-100/60 px-4 py-3 text-sm font-semibold text-forest-900 transition duration-200 border border-orange-100/30"
                >
                  <span>💻</span> Dashboard
                </Link>
                <Link
                  href="/dashboard#blogs"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl bg-orange-50/50 hover:bg-orange-100/60 px-4 py-3 text-sm font-semibold text-forest-900 transition duration-200 border border-orange-100/30"
                >
                  <span>📰</span> Articles
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl bg-orange-50/50 hover:bg-orange-100/60 px-4 py-3 text-sm font-semibold text-forest-900 transition duration-200 border border-orange-100/30"
                >
                  <span>👤</span> My CV & Profile
                </Link>
              </div>
            </div>
            
            {/* Drawer Account Information & Logout */}
            <div className="pt-4 border-t border-orange-50 space-y-4">
              <div className="flex items-center gap-3">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="avatar" className="h-9 w-9 rounded-full object-cover ring-2 ring-leaf-400/50" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-leaf-100 text-xs font-semibold text-forest-800">
                    {user?.displayName?.[0] ?? user?.email?.[0] ?? "S"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-forest-900 truncate leading-none">{user?.displayName ?? "Student"}</p>
                  <p className="text-[10px] text-ink-400 truncate mt-1 leading-none">{user?.email}</p>
                </div>
              </div>
              
              <button
                onClick={handleSignOut}
                className="w-full text-center rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs font-bold text-white transition duration-200 shadow-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}