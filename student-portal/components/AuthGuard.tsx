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

  if (checking)
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );

  return <>{children}</>;
}