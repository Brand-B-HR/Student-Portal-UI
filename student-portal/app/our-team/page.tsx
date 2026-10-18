"use client";

import PublicShell from "@/components/PublicShell";
import Container from "@/components/ui/Container";
import ConsultantCard from "@/components/ConsultantCard";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { fetchConsultants } from "@/lib/consultants";
import { useAsync } from "@/hooks/useAsync";

/** Shown for the empty and error states, and as the page's own mark. */
const TeamIcon = (
  <svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-current stroke-[1.5]">
    <path
      d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * The consultant directory. Public, like the blog — the API serves it to
 * anonymous callers, so this uses PublicShell and guests see the team before
 * signing in. Booking is student-only and gated separately.
 */
export default function OurTeamPage() {
  // The directory is small, name-ordered and cached for 60s server-side, so
  // it comes back whole — there is no paging to do here.
  const { data, loading, error } = useAsync((signal) => fetchConsultants(signal), []);
  const consultants = data ?? [];

  return (
    <PublicShell>
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
        {error ? (
          <ErrorState
            message="We couldn't load the team. Please try again in a moment."
            onRetry={() => window.location.reload()}
          />
        ) : loading ? null : consultants.length === 0 ? (
          /* An empty directory degrades to the placeholder this page used to
             be, rather than to a bare heading over nothing. */
          <EmptyState
            icon={TeamIcon}
            title="Coming soon"
            description="Meet the recruiters and hiring managers behind Stars, and book a one-to-one consultation — right here, shortly."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {consultants.map((c) => (
              <ConsultantCard key={c.id} consultant={c} />
            ))}
          </div>
        )}
      </Container>
    </PublicShell>
  );
}
