import type { ReactNode } from "react";
import AuthGuard from "@/components/AuthGuard";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

/** Header + main + footer, behind the auth guard. Every signed-in page uses this. */
export default function SiteShell({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col bg-surface-subtle">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </AuthGuard>
  );
}
