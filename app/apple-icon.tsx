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
          gap: 6,
          background:
            "linear-gradient(135deg, #ff2d95 0%, #00e8ff 55%, #b362ff 100%)"
        }}
      >
        <div style={{ fontSize: 86, lineHeight: 1 }}>🇹🇼</div>
        <div style={{ fontSize: 44, fontWeight: 900, color: "#fff" }}>台北</div>
      </div>
    ),
    size
  );
}
