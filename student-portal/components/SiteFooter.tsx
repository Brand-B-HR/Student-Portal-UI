import Link from "next/link";
import Container from "@/components/ui/Container";

/**
 * Only pages that exist. The three columns this replaced were mostly disabled
 * "Soon" rows for features with no page behind them — add entries back here as
 * the pages land, rather than listing them before they work.
 */
const LINKS = [
  { label: "Articles", href: "/blog" },
  { label: "Jobs", href: "/jobs" },
  { label: "CV Review", href: "/upload" },
];

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <Container className="py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">

          <div>
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="" className="h-9 w-9 rounded-[9px] object-contain" />
              <span className="font-serif text-[19px] font-semibold tracking-[-0.02em] text-ink-900">
               Stars
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
              Career guidance by practitioners, for professionals who take their growth
              seriously.
            </p>
          </div>

          <nav>
            <ul className="flex flex-wrap gap-x-7 gap-y-2.5">
              {LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-600 transition-colors hover:text-brand-700"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-400">
            &copy; {new Date().getFullYear()} Stars. All rights reserved.
          </p>
          <p className="font-serif text-xs italic text-ink-400">
            Built for students, by people who hire them.
          </p>
        </div>
      </Container>
    </footer>
  );
}
