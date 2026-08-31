"use client";

import { useEffect } from "react";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-subtle px-5 py-20">
      <Container size="narrow" className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-500">
          Something went wrong
        </p>
        <h1 className="mt-3 font-serif text-3xl font-semibold text-ink-900 sm:text-4xl">
          We hit a snag loading this page
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-500">
          Try again, or head back to the dashboard. If this keeps happening, let us know
          what you were doing when it broke.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <Button href="/dashboard" variant="secondary">
            Go to dashboard
          </Button>
        </div>
      </Container>
    </div>
  );
}
