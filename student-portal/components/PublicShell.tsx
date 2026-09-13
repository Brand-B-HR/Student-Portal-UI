import type { ReactNode } from "react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

/**
 * Header + main + footer, WITHOUT the auth guard. Use for pages guests can
 * see — the marketing home, the article list, and article pages (which gate
 * full content per-viewer themselves). Signed-in-only pages keep using
 * SiteShell instead.
 */
export default function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-subtle">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
