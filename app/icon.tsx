import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

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
          gap: 18,
          background:
            "linear-gradient(135deg, #ff2d95 0%, #00e8ff 55%, #b362ff 100%)",
          color: "#04081e"
        }}
      >
        <div style={{ fontSize: 210, lineHeight: 1 }}>🇹🇼</div>
        <div
          style={{
            fontSize: 124,
            fontWeight: 900,
            color: "#fff",
            letterSpacing: "0.04em"
          }}
        >
          Y&amp;S
        </div>
      </div>
    ),
    size
  );
}
