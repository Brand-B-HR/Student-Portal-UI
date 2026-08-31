"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";

export interface ActiveAd {
  id: number;
  adName: string;
  blobUrl: string;
  displayDurationSeconds: number;
  targetUrl?: string | null;
  createdAt: string;
}

type Variant = "strip" | "sidebar";

const frames: Record<Variant, string> = {
  /** Thin leaderboard that sits between content sections. */
  strip: "h-[104px] sm:h-[130px]",
  /** Compact box for the sidebar rail. */
  sidebar: "h-[150px]",
};

/**
 * Small, contained advert slot. Rotates through active ads on the
 * cadence each ad specifies. Renders nothing when there are no ads,
 * so it never leaves an empty hole in the layout.
 */
export default function AdBanner({
  variant = "strip",
  className = "",
}: {
  variant?: Variant;
  className?: string;
}) {
  const [ads, setAds] = useState<ActiveAd[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/adverts/active`, { signal: ctrl.signal });
        if (res.ok) setAds(await res.json());
      } catch {
        /* ads are non-critical — stay silent and render nothing */
      }
    })();
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    const ms = (ads[index]?.displayDurationSeconds || 6) * 1000;
    const t = setTimeout(() => setIndex((i) => (i + 1) % ads.length), ms);
    return () => clearTimeout(t);
  }, [ads, index]);

  if (ads.length === 0) return null;

  const ad = ads[index];

  const media = (
    <div
      className={`relative w-full overflow-hidden rounded-[12px] border border-line bg-surface-muted ${frames[variant]}`}
    >
      <img
        src={ad.blobUrl}
        alt={ad.adName}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />

      {ads.length > 1 && (
        <div className="absolute bottom-2 right-2.5 flex gap-1.5">
          {ads.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show advert ${i + 1}`}
              onClick={(e) => {
                e.preventDefault();
                setIndex(i);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-4 bg-white" : "w-1.5 bg-white/55 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={className}>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-300">
        Sponsored
      </p>
      {ad.targetUrl ? (
        <a
          href={ad.targetUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="group block"
        >
          {media}
        </a>
      ) : (
        <div className="group">{media}</div>
      )}
    </div>
  );
}
