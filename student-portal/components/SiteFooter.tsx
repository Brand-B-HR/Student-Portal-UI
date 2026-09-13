import Link from "next/link";
import Container from "@/components/ui/Container";

/** `href: null` renders a disabled "Soon" row instead of a link — no page exists behind it yet. */
const COLUMNS = [
  {
    heading: "Content",
    links: [
      { label: "Articles", href: "/blog" },
      { label: "Interview Prep", href: "/blog" },
      { label: "Guides", href: null },
      { label: "Video Library", href: null },
    ],
  },
  {
    heading: "Platform",
    links: [
      { label: "CV Review", href: "/upload" },
      { label: "Career Coaching", href: null },
      { label: "Community", href: null },
      { label: "Newsletter", href: null },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: null },
      { label: "Advertise with us", href: null },
      { label: "Privacy Policy", href: null },
      { label: "Terms", href: null },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">

          <div>
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="" className="h-9 w-9 rounded-[9px] object-contain" />
              <span className="font-serif text-[19px] font-semibold tracking-[-0.02em] text-ink-900">
                CareerBuild
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
              Career guidance by practitioners, for professionals who take their growth
              seriously.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.href ? (
                      <Link
                        href={link.href}
                        className="text-sm text-ink-600 transition-colors hover:text-brand-700"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-ink-300">
                        {link.label}
                        <span className="rounded-full bg-surface-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-ink-400">
                          Soon
                        </span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-400">
            &copy; {new Date().getFullYear()} CareerBuild. All rights reserved.
          </p>
          <p className="font-serif text-xs italic text-ink-400">
            Built for students, by people who hire them.
          </p>
        </div>
      </Container>
    </footer>
  );
}
