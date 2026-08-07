"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, onAuthStateChanged } from "@/lib/firebase";
import { bootstrapStudentProfile } from "@/lib/api";

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
        .catch(() => undefined)
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