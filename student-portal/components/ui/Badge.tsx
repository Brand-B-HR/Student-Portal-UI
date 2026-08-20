import type { ReactNode } from "react";

type Tone = "brand" | "neutral" | "solid" | "outline";

const tones: Record<Tone, string> = {
  brand: "bg-brand-100 text-brand-700 border border-brand-200",
  neutral: "bg-surface-muted text-ink-500 border border-line",
  solid: "bg-brand-500 text-white border border-brand-500",
  outline: "bg-transparent text-ink-500 border border-line-strong",
};

export default function Badge({
  children,
  tone = "brand",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
