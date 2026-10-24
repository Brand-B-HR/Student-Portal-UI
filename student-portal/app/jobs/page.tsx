"use client";

import { useMemo, useState } from "react";
import SiteShell from "@/components/SiteShell";
import Container from "@/components/ui/Container";
import JobCard from "@/components/JobCard";
import SearchableSelect from "@/components/SearchableSelect";
import { EmptyState, ErrorState } from "@/components/ui/States";
import ApplyDialog from "@/components/ApplyDialog";
import { fetchJobs, fetchMyApplications, type JobOpening } from "@/lib/jobs";
import { useAsync } from "@/hooks/useAsync";

export default function JobsPage() {
  const [companyId, setCompanyId] = useState("");
  const [specification, setSpecification] = useState("");

  // The API returns the filter options alongside the jobs and keeps them independent of the
  // active filters, so the dropdowns don't shrink as the student narrows the list.
  const { data, loading, error } = useAsync(
    (signal) => fetchJobs({ companyId, specification }, signal),
    [companyId, specification]
  );

  // Failing to load applications just means every card offers Apply; the server rejects a repeat anyway.
  const { data: applications } = useAsync((signal) => fetchMyApplications(signal).catch(() => []), []);
  const [justApplied, setJustApplied] = useState<string[]>([]);
  const [applyingTo, setApplyingTo] = useState<JobOpening | null>(null);
  const appliedIds = useMemo(
    () => new Set([...(applications ?? []).map((a) => a.recruitmentId), ...justApplied]),
    [applications, justApplied]
  );

  const jobs = data?.jobs ?? [];
  const companyOptions = useMemo(
    () => (data?.companies ?? []).map((c) => ({ value: c.id, label: c.name })),
    [data]
  );
  const filtered = companyId !== "" || specification !== "";

  return (
    <SiteShell>
      <section className="border-b border-line bg-brand-100">
        <Container className="py-6 sm:py-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
            Opportunities
          </p>
          <h1 className="mt-1.5 font-serif text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-900 sm:text-[40px]">
            Job openings
          </h1>
        </Container>
      </section>

      <Container className="py-10 sm:py-12">
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <SearchableSelect
            label="Company"
            options={companyOptions}
            value={companyId}
            onChange={setCompanyId}
            allLabel="All companies"
          />
          <div>
            <label
              htmlFor="job-specification"
              className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.1em] text-ink-500"
            >
              Job specification
            </label>
            <select
              id="job-specification"
              value={specification}
              onChange={(e) => setSpecification(e.target.value)}
              className="w-full rounded-[10px] border border-line-strong bg-white px-3.5 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            >
              <option value="">All specifications</option>
              {(data?.specifications ?? []).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {filtered && (
            <button
              onClick={() => {
                setCompanyId("");
                setSpecification("");
              }}
              className="rounded-full border border-line-strong bg-white px-4 py-2.5 text-xs font-semibold text-ink-700 transition-colors hover:bg-brand-100"
            >
              Clear filters
            </button>
          )}
        </div>

        {error ? (
          <ErrorState
            message="Could not load job openings. Please try again later."
            onRetry={() => window.location.reload()}
          />
        ) : loading && !data ? null : jobs.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-current stroke-[1.5]">
                <path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M4 7h16v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            title={filtered ? "No matching openings" : "No openings right now"}
            description={
              filtered
                ? "Try a different company or specification."
                : "New openings from our partner companies will appear here."
            }
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-ink-500">
              {jobs.length} {jobs.length === 1 ? "opening" : "openings"}
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} applied={appliedIds.has(job.id)} onApply={setApplyingTo} />
              ))}
            </div>
          </>
        )}
      </Container>

      {applyingTo && (
        <ApplyDialog
          job={applyingTo}
          onClose={() => setApplyingTo(null)}
          onApplied={(id) => setJustApplied((ids) => [...ids, id])}
        />
      )}
    </SiteShell>
  );
}
