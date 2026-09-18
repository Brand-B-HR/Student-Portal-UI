"use client";

import { useEffect } from "react";

// Rendered only when the root layout itself throws, so it replaces <html>/<body>
// entirely and can't depend on globals.css or other app components having loaded.
export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          backgroundColor: "#fffaf3",
          color: "#1c1410",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 420 }}>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#ef9f26",
            }}
          >
            Something went wrong
          </p>
          <h1 style={{ marginTop: 12, fontSize: 28, fontWeight: 600 }}>
            CareerBuild hit a snag
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6, color: "#7a655a" }}>
            The app failed to load. Try again, or reload the page.
          </p>
          <div
            style={{
              marginTop: 28,
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={reset}
              style={{
                height: 40,
                padding: "0 20px",
                borderRadius: 9999,
                border: "1px solid #ef9f26",
                backgroundColor: "#ef9f26",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- this file replaces the whole tree on a root-layout crash, so it can't rely on next/link's router context */}
            <a
              href="/"
              style={{
                height: 40,
                padding: "0 20px",
                borderRadius: 9999,
                border: "1px solid #e2d2bf",
                backgroundColor: "#fff",
                color: "#1c1410",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Reload app
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
