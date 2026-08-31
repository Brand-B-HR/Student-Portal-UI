import SiteShell from "@/components/SiteShell";
import Container from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/States";

export default function JobsPage() {
  return (
    <SiteShell>
      <section className="border-b border-line bg-brand-100">
        <Container className="py-6 sm:py-7">
          <h1 className="font-serif text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-900 sm:text-[40px]">
            Job openings
          </h1>
        </Container>
      </section>

      <Container className="py-10 sm:py-12">
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-current stroke-[1.5]">
              <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M4 7h16v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          title="No openings yet"
          description="We're setting up job listings — check back soon."
        />
      </Container>
    </SiteShell>
  );
}
