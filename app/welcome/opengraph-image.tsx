import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "mingle — Post a job. Get the right people. Understand why.";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background:
            "linear-gradient(145deg, #ffffff 0%, #f7f5ff 45%, #e9effe 100%)",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            color: "#4d42db",
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          mingle
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              color: "#1c1b2e",
              fontSize: 64,
              fontWeight: 600,
              lineHeight: 1.12,
              letterSpacing: "-0.03em",
              maxWidth: 980,
            }}
          >
            Post a job. Get the right people. Understand why.
          </div>
          <div
            style={{
              display: "flex",
              color: "#65647e",
              fontSize: 30,
              fontWeight: 500,
              lineHeight: 1.35,
              maxWidth: 860,
            }}
          >
            The few people worth talking to — in seconds.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#4d42db",
            fontSize: 24,
            fontWeight: 600,
          }}
        >
          <span>Role Fit · Human Fit · Motivation Fit</span>
          <span>mingle.careers/welcome</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
