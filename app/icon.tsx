import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

// Home-screen / PWA app icon — text-forward "Y&S TAIPEI" on a neon gradient,
// no flag. Content stays inside the central ~70% so it survives Android's
// maskable crop.
export default function Icon() {
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
          gap: 26,
          background: "linear-gradient(152deg, #ff2d95 0%, #b362ff 46%, #00e8ff 100%)"
        }}
      >
        <div
          style={{
            fontSize: 188,
            fontWeight: 900,
            color: "#fff",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            textShadow: "0 10px 30px rgba(11, 4, 30, 0.45)"
          }}
        >
          Y&amp;S
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "rgba(11, 4, 30, 0.82)",
            letterSpacing: "0.34em"
          }}
        >
          TAIPEI
        </div>
      </div>
    ),
    size
  );
}
