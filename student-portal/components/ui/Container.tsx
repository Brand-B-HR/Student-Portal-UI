import type { ReactNode } from "react";

const widths = {
  narrow: "max-w-3xl",   // article reading column
  default: "max-w-6xl",  // standard page
  wide: "max-w-7xl",     // dense listing
} as const;

export default function Container({
  children,
  size = "default",
  className = "",
}: {
  children: ReactNode;
  size?: keyof typeof widths;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full ${widths[size]} px-5 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}
