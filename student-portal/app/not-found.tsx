import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import PublicShell from "@/components/PublicShell";

export default function NotFound() {
  return (
    <PublicShell>
      <Container size="narrow" className="py-20 text-center sm:py-28">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-500">
          404
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-ink-900 sm:text-4xl">
          This page doesn&apos;t exist
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500">
          The link might be broken, or the page may have moved. Let&apos;s get you back to
          somewhere useful.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button href="/dashboard">Go to dashboard</Button>
          <Button href="/blog" variant="secondary">
            Browse articles
          </Button>
        </div>
      </Container>
    </PublicShell>
  );
}
