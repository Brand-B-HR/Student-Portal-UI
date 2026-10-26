import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import type { JobOpening } from "@/lib/jobs";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function JobCard({
  job,
  applied,
  onApply,
}: {
  job: JobOpening;
  applied: boolean;
  onApply: (job: JobOpening) => void;
}) {
  return (
    <article className="flex flex-col gap-3 rounded-[14px] border border-line bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge>{job.employmentType}</Badge>
        {job.industry && <Badge tone="outline">{job.industry}</Badge>}
      </div>
      <div>
        <h3 className="font-serif text-lg font-semibold leading-snug text-ink-900">{job.specification}</h3>
        <p className="mt-0.5 text-sm font-medium text-brand-700">{job.companyName}</p>
      </div>
      {job.description && (
        <p className="line-clamp-4 whitespace-pre-line text-sm leading-relaxed text-ink-500">{job.description}</p>
      )}
      <dl className="mt-auto flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-xs text-ink-500">
        <div>
          <dt className="inline font-semibold">Vacancies: </dt>
          <dd className="inline">{job.vacancies}</dd>
        </div>
        <div>
          <dt className="inline font-semibold">Needed by: </dt>
          <dd className="inline">{dateFormat.format(new Date(job.neededByDate))}</dd>
        </div>
      </dl>
      {applied ? (
        <Button variant="secondary" size="sm" disabled className="self-start">
          Applied
        </Button>
      ) : (
        <Button size="sm" onClick={() => onApply(job)} className="self-start">
          Apply
        </Button>
      )}
    </article>
  );
}
