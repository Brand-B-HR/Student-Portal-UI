import SiteShell from "@/components/SiteShell";
import Container from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/States";

/**
 * Placeholder for the consultation offering. The dashboard's "Get
 * consultation" shortcut points here, so this page is the destination for
 * anyone following that link — keep it until the real team profiles and
 * booking flow are ready.
 */
export default function OurTeamPage() {
  return (
    <SiteShell>
      <section className="border-b border-line bg-brand-100">
        <Container className="py-6 sm:py-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
            Consultation
          </p>
          <h1 className="mt-1.5 font-serif text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-900 sm:text-[40px]">
            Our team
          </h1>
        </Container>
      </section>

      <Container className="py-10 sm:py-12">
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-current stroke-[1.5]">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          title="Coming soon"
          description="Meet the recruiters and hiring managers behind Stars, and book a one-to-one consultation — right here, shortly."
        />
      </Container>
    </SiteShell>
  );
}
