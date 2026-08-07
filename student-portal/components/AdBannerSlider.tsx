"use client";

import { useEffect, useState } from "react";

export interface ActiveAd {
  id: number;
  adName: string;
  blobUrl: string;
  displayDurationSeconds: number;
  targetUrl?: string | null;
  createdAt: string;
}

export default function AdBannerSlider() {
  const [ads, setAds] = useState<ActiveAd[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAds() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5033";
        const res = await fetch(`${apiUrl}/api/adverts/active`);
        if (res.ok) {
          const data: ActiveAd[] = await res.json();
          setAds(data);
        }
      } catch (err) {
        console.error("Failed to fetch active ads:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAds();
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;

    const currentAd = ads[currentIndex];
    const duration = (currentAd?.displayDurationSeconds || 5) * 1000;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, duration);

    return () => clearTimeout(timer);
  }, [ads, currentIndex]);

  if (loading || ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  const content = (
    <div className="relative w-full overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer border border-gray-200">
      <div className="relative w-full h-[90px] sm:h-[110px] overflow-hidden">
        <img
          src={currentAd.blobUrl}
          alt={currentAd.adName}
          className="h-full w-full object-fill group-hover:scale-[1.01] transition-transform duration-300"
        />
        {ads.length > 1 && (
          <div className="absolute bottom-2 right-3 flex gap-1.5 z-10">
            {ads.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? "w-5 bg-white shadow-md" : "w-1.5 bg-white/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (currentAd.targetUrl) {
    return (
      <a href={currentAd.targetUrl} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }

  return content;
}
