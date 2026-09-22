import { ImageResponse } from "next/og";

export const runtime = "edge";

// Eén herbruikbare OG-afbeelding voor alle marketingpagina's: /api/og?title=...&eyebrow=...
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") || "Roosterprogramma voor kleine horeca";
  const eyebrow = searchParams.get("eyebrow") || "Shiftje";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#1B1B18",
          color: "#FAF7F2",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#E8A33D", fontWeight: 600 }}>{eyebrow}</div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: 900,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 26, color: "#DDD5C7" }}>
          shiftje.nl — beschikbaarheid, rooster &amp; uren op één plek
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
