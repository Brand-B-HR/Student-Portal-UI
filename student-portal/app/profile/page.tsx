"use client";

import { useEffect, useState } from "react";
import SiteShell from "@/components/SiteShell";
import Container from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/States";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import type { User } from "@/lib/firebase";
import { initialsOf } from "@/lib/articles";

/**
 * Name and email only, for now.
 *
 * This page previously rendered the full CV workspace — active CV, extracted
 * fields, reviewer feedback, video. That was cut back deliberately while the
 * profile API is being finalised; recover it with
 * `git checkout HEAD -- app/profile/page.tsx` when the fields are ready.
 *
 * Both values come straight off the Firebase user rather than the backend:
 * there's nothing to fetch yet, and AuthGuard has already resolved the session
 * by the time this renders.
 */
export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return () => unsub();
  }, []);

  const name = user?.displayName?.trim();

  return (
    <SiteShell>
      <section className="border-b border-line bg-brand-100">
        <Container className="py-6 sm:py-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
            Account
          </p>
          <h1 className="mt-1.5 font-serif text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-900 sm:text-[40px]">
            My profile
          </h1>
        </Container>
      </section>

      <Container className="py-10 sm:py-12">
        <div className="max-w-xl rounded-[14px] border border-line bg-white p-6 sm:p-7">
          {!ready ? (
            <div className="space-y-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-56" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="h-14 w-14 rounded-full object-cover ring-1 ring-line-strong"
                  />
                ) : (
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-base font-bold text-brand-700 ring-1 ring-brand-200">
                    {initialsOf(name || user?.email || "Student")}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-serif text-xl font-semibold text-ink-900">
                    {name || "Student"}
                  </p>
                  <p className="truncate text-sm text-ink-500">{user?.email}</p>
                </div>
              </div>

              <dl className="mt-7 space-y-5 border-t border-line pt-6">
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-400">
                    Name
                  </dt>
                  <dd className="mt-1 text-[15px] text-ink-900">
                    {name || <span className="text-ink-400">Not set</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-400">
                    Email
                  </dt>
                  <dd className="mt-1 break-all text-[15px] text-ink-900">{user?.email}</dd>
                </div>
              </dl>
            </>
          )}
        </div>
      </Container>
    </SiteShell>
  );
}
