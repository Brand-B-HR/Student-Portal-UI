import Link from "next/link";
import Container from "@/components/ui/Container";

const COLUMNS = [
  {
    heading: "Explore",
    links: [
      { label: "Home", href: "/dashboard" },
      { label: "All Articles", href: "/blog" },
    ],
  },
  {
    heading: "Your account",
    links: [
      { label: "My CV & Profile", href: "/profile" },
      { label: "Update CV", href: "/upload" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <Container className="py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">

          <div>
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="" className="h-9 w-9 rounded-[9px] object-contain" />
              <span className="font-serif text-[19px] font-semibold tracking-[-0.02em] text-ink-900">
                CareerBuild
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-500">
              Career guidance, hiring insight, and CV tools &mdash; written by the people who
              actually do the hiring.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">
                {col.heading}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-600 transition-colors hover:text-brand-700"
                    >
                      {link.label}
                    </Link>
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
