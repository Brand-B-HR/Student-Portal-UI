import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { initialsOf } from "@/lib/articles";
import type { Consultant } from "@/lib/consultants";

/** Specialties beyond this are collapsed into a +N chip so cards stay level. */
const MAX_SPECIALTIES = 3;

/**
 * Photo, or a deterministic branded fallback when the consultant has none —
 * same approach as ArticleCard's Cover, keyed off the id so a given person
 * always gets the same colour.
 */
function Avatar({ consultant }: { consultant: Consultant }) {
  const className =
    "h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border border-line object-cover";

  if (consultant.photoUrl) {
    return (
      <img
        src={consultant.photoUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className={className}
      />
    );
  }

  const hues = [
    "from-brand-400 to-brand-600",
    "from-brand-500 to-ink-700",
    "from-ink-800 to-brand-600",
    "from-brand-300 to-brand-500",
  ];
  const hue = hues[consultant.id % hues.length];

  return (
    <div
      aria-hidden
      className={`${className} flex items-center justify-center bg-gradient-to-br ${hue}`}
    >
      <span className="text-sm font-bold text-white/80 select-none">
        {initialsOf(consultant.fullName)}
      </span>
    </div>
  );
}

// bookingHref is optional: without it the card shows a plain availability badge
/** One consultant in the team directory. */
export default function ConsultantCard({
  consultant,
  bookingHref,
}: {
  consultant: Consultant;
  bookingHref?: string;
}) {
  const extra = consultant.specialties.length - MAX_SPECIALTIES;

  return (
    <article className="flex flex-col gap-4 rounded-[14px] border border-line bg-white p-5 shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]">
      <div className="flex items-center gap-3.5">
        <Avatar consultant={consultant} />
        <div className="min-w-0">
          <h3 className="font-serif text-[19px] font-semibold leading-[1.25] text-ink-900">
            {consultant.fullName}
          </h3>
          <p className="mt-0.5 text-sm leading-snug text-ink-500">{consultant.title}</p>
        </div>
      </div>

      {consultant.bio && (
        <p className="text-sm leading-relaxed text-ink-500 line-clamp-3">{consultant.bio}</p>
      )}

      {consultant.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {consultant.specialties.slice(0, MAX_SPECIALTIES).map((s) => (
            <Badge key={s} tone="neutral">
              {s}
            </Badge>
          ))}
          {extra > 0 && <Badge tone="outline">+{extra}</Badge>}
        </div>
      )}

      <div className="mt-auto border-t border-line pt-3.5">
        {!consultant.isAcceptingBookings ? (
          <Badge tone="outline">Not taking bookings</Badge>
        ) : bookingHref ? (
          <Link
            href={bookingHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-brand-600"
          >
            Book a session
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[2.5]">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : (
          <Badge tone="brand">Available for consultations</Badge>
        )}
      </div>
    </article>
  );
}
