import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          background: "linear-gradient(152deg, #ff2d95 0%, #b362ff 46%, #00e8ff 100%)"
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            textShadow: "0 4px 12px rgba(11, 4, 30, 0.4)"
          }}
        >
          Y&amp;S
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "rgba(11, 4, 30, 0.82)",
            letterSpacing: "0.32em"
          }}
        >
          TAIPEI
        </div>
      </div>
    ),
    size
  );
}
