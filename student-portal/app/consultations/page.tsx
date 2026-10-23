"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import SiteShell from "@/components/SiteShell";
import ConsultationCard from "@/components/ConsultationCard";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { ApiError } from "@/lib/api";
import { browserTimeZone, cancelConsultation, fetchMyConsultations } from "@/lib/consultations";
import { errorMessage } from "@/lib/errors";
import { useAsync } from "@/hooks/useAsync";

type Tab = "upcoming" | "past";

export default function MyConsultationsPage() {
  const router = useRouter();
  const timeZone = useMemo(() => browserTimeZone(), []);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [version, setVersion] = useState(0);
  const [cancelling, setCancelling] = useState(false);

  const { data, loading, error } = useAsync((signal) => fetchMyConsultations(tab, signal), [tab, version]);
  const consultations = data ?? [];

  async function handleCancel(id: number, reason?: string) {
    setCancelling(true);
    try {
      await cancelConsultation(id, reason);
      toast.success("Your session was cancelled.");
    } catch (e: unknown) {
      if (e instanceof ApiError && e.status === 401) {
        router.push("/login");
        return;
      }
      toast.error(errorMessage(e, "We couldn't cancel that session. Please try again."));
    } finally {
      setCancelling(false);
      setVersion((v) => v + 1);
    }
  }

  return (
    <SiteShell>
      <section className="border-b border-line bg-brand-100">
        <Container className="py-6 sm:py-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">Consultation</p>
          <h1 className="mt-1.5 font-serif text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-900 sm:text-[40px]">
            My sessions
          </h1>
        </Container>
      </section>

      <Container size="narrow" className="py-10 sm:py-12">
        <div role="tablist" className="mb-6 flex gap-2">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              type="button"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize transition-colors ${
                tab === t
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-line-strong bg-white text-ink-700 hover:border-brand-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {error ? (
          <ErrorState
            message="We couldn't load your sessions. Please try again in a moment."
            onRetry={() => setVersion((v) => v + 1)}
          />
        ) : loading ? null : consultations.length === 0 ? (
          <EmptyState
            title={tab === "upcoming" ? "No upcoming sessions" : "No past sessions"}
            description={
              tab === "upcoming"
                ? "Book a one-to-one with one of our consultants."
                : "Completed and cancelled sessions will show up here."
            }
            action={tab === "upcoming" ? <Button href="/our-team">Meet the team</Button> : undefined}
          />
        ) : (
          <div className="flex flex-col gap-5">
            {consultations.map((c) => (
              <ConsultationCard
                key={c.id}
                consultation={c}
                timeZone={timeZone}
                cancelling={cancelling}
                onCancel={handleCancel}
              />
            ))}
          </div>
        )}
      </Container>
    </SiteShell>
  );
}
