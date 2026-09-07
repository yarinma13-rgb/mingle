"use client";

import { useEffect } from "react";
import { captureException } from "@/lib/monitoring/sentry";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F8FC",
          color: "#252238",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem("mingle-theme")==="dark"){document.body.style.background="#0F1420";document.body.style.color="#F3F5F9";var s=document.querySelector("p:nth-of-type(2)");if(s)s.style.color="#E1E4EA";}}catch(e){}})();`,
          }}
        />
        <title>mingle</title>
        <p style={{ fontSize: "20px", fontWeight: 700 }}>Something went wrong</p>
        <p style={{ marginTop: "8px", fontSize: "14px", color: "#77738A" }}>
          Try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            marginTop: "24px",
            border: 0,
            borderRadius: "999px",
            background: "#0073EA",
            color: "#FFFFFF",
            padding: "12px 32px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
