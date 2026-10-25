"use client";

import { useState } from "react";
import SiteShell from "@/components/SiteShell";
import ApplicationCard from "@/components/ApplicationCard";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { fetchMyApplications } from "@/lib/jobs";
import { useAsync } from "@/hooks/useAsync";

export default function MyApplicationsPage() {
  const [version, setVersion] = useState(0);
  const { data, loading, error } = useAsync((signal) => fetchMyApplications(signal, false), [version]);
  const applications = data ?? [];

  return (
    <SiteShell>
      <section className="border-b border-line bg-brand-100">
        <Container className="py-6 sm:py-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">Opportunities</p>
          <h1 className="mt-1.5 font-serif text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-900 sm:text-[40px]">
            My applications
          </h1>
        </Container>
      </section>

      <Container size="narrow" className="py-10 sm:py-12">
        {error ? (
          <ErrorState
            message="We couldn't load your applications. Please try again in a moment."
            onRetry={() => setVersion((v) => v + 1)}
          />
        ) : loading ? null : applications.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description="When you apply for a job opening, you can follow how it is going here."
            action={<Button href="/jobs">Browse job openings</Button>}
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-ink-500">
              {applications.length} {applications.length === 1 ? "application" : "applications"}
            </p>
            <div className="flex flex-col gap-5">
              {applications.map((a) => (
                <ApplicationCard key={a.id} application={a} />
              ))}
            </div>
          </>
        )}
      </Container>
    </SiteShell>
  );
}
