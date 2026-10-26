"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, onAuthStateChanged, signOut } from "@/lib/firebase";
import { bootstrapStudentProfile, ApiError } from "@/lib/api";
import { toast } from "react-toastify";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      bootstrapStudentProfile()
        .catch(async (err: unknown) => {
          if (err instanceof ApiError && err.status === 403) {
            router.replace("/verify-email");
            return;
          }
          if (err instanceof ApiError && err.status === 409) {
            toast.error(err.message);
            await signOut();
            router.replace("/login");
            return;
          }
        })
        .finally(() => {
          setChecking(false);
        });
    });
    return () => unsub();
  }, [router]);

  // The bootstrap call above is tracked, so the global overlay already covers
  // this wait — rendering a second spinner here would stack two of them.
  if (checking) return null;

  return <>{children}</>;
}