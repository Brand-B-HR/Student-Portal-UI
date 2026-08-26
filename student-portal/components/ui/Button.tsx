import Link from "next/link";
import type { ReactNode, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "inverse";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white border border-brand-500 hover:bg-brand-600 hover:border-brand-600 shadow-[0_1px_2px_rgba(28,20,16,0.06)]",
  secondary:
    "bg-white text-ink-900 border border-line-strong hover:border-brand-500 hover:text-brand-700",
  ghost:
    "bg-transparent text-ink-600 border border-transparent hover:bg-brand-100 hover:text-brand-700",
  inverse:
    "bg-ink-900 text-white border border-ink-900 hover:bg-ink-800",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-[15px] gap-2",
};

const base =
  "inline-flex items-center justify-center rounded-full font-semibold transition-colors duration-150 disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap";

type Props = {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  href?: string;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  className = "",
  ...rest
}: Props) {
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
