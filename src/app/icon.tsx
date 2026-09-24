import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Favicon: een lijnicoontje van een kopje in plaats van het standaard
// Next.js-icoontje. Bewust een getekend SVG-icoon (net als de bel/chat-
// icoontjes elders), geen emoji-teken: Satori (de renderer achter
// next/og ImageResponse) rendert emoji niet als platte tekst, dat vereist
// een externe lettertype-aanroep per keer die dit favicon wordt opgehaald.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF7F2",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1B1B18"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 10h13v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
          <path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17" />
          <path d="M7 4c0 1-1 1-1 2s1 1 1 2" />
          <path d="M11 4c0 1-1 1-1 2s1 1 1 2" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
