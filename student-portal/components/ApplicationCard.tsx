import Badge from "@/components/ui/Badge";
import { progressCopy } from "@/lib/applicationProgress";
import type { MyApplication } from "@/lib/jobs";

const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function sent(app: MyApplication): string {
  if (app.hasCv && app.hasVideo) return "CV and intro video";
  if (app.hasCv) return "CV";
  if (app.hasVideo) return "Intro video";
  return "";
}

export default function ApplicationCard({ application }: { application: MyApplication }) {
  const progress = progressCopy(application.progress);
  const attached = sent(application);

  return (
    <article className="flex flex-col gap-3 rounded-[14px] border border-line bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-[19px] font-semibold leading-snug text-ink-900">{application.specification}</h3>
          <p className="mt-0.5 text-sm font-medium text-brand-700">{application.companyName}</p>
        </div>
        <Badge tone={progress.tone}>{progress.label}</Badge>
      </div>

      <p className="text-sm text-ink-600">{progress.description(application.companyName)}</p>

      <p className="border-t border-line pt-3 text-xs text-ink-500">
        {application.employmentType} · Applied {dateFormat.format(new Date(application.appliedAt))}
        {attached && ` · Sent: ${attached}`}
      </p>
    </article>
  );
}
