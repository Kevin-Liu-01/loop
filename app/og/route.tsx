import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import {
  OG_HEIGHT,
  OG_WIDTH,
  SEO_DEFAULT_DESCRIPTION,
  SEO_DEFAULT_TITLE,
  SITE_NAME,
} from "@/lib/seo";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") || SEO_DEFAULT_TITLE;
  const description = searchParams.get("description") || SEO_DEFAULT_DESCRIPTION;
  const category = searchParams.get("category") || null;

  return new ImageResponse(
    <OgCard title={title} description={description} category={category} />,
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        "Content-Type": "image/png",
      },
    },
  );
}

type OgCardProps = {
  title: string;
  description: string;
  category: string | null;
};

function OgCard({ title, description, category }: OgCardProps) {
  const displayTitle = title.length > 80 ? `${title.slice(0, 77)}...` : title;
  const displayDesc =
    description.length > 140 ? `${description.slice(0, 137)}...` : description;
  const titleSize = displayTitle.length > 50 ? 46 : 56;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#050505",
      }}
    >
      {/* Warm radial glow from bottom-left */}
      <div
        style={{
          position: "absolute",
          bottom: "-120px",
          left: "-80px",
          width: "800px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(232, 101, 10, 0.10) 0%, transparent 70%)",
        }}
      />

      {/* Cool radial glow from top-right */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          right: "-100px",
          width: "600px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(232, 101, 10, 0.04) 0%, transparent 70%)",
        }}
      />

      {/* Right accent stripe */}
      <div
        style={{
          position: "absolute",
          top: "0",
          right: "0",
          width: "5px",
          height: "100%",
          background:
            "linear-gradient(to bottom, #e8650a 0%, rgba(232, 101, 10, 0.3) 60%, transparent 100%)",
        }}
      />

      {/* Subtle horizontal rule */}
      <div
        style={{
          position: "absolute",
          bottom: "80px",
          left: "56px",
          right: "56px",
          height: "1px",
          background:
            "linear-gradient(to right, rgba(255,255,255,0.06), rgba(255,255,255,0.03), transparent)",
        }}
      />

      {/* Content layer */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 56px",
          width: "100%",
          position: "relative",
        }}
      >
        {/* Header: Logo + site name */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <GearIcon />
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "rgba(255, 255, 255, 0.40)",
            }}
          >
            {SITE_NAME}
          </span>
        </div>

        {/* Main: category + title + description */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            maxWidth: "940px",
          }}
        >
          {category && (
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "#e8650a",
                  borderLeft: "3px solid #e8650a",
                  paddingLeft: "10px",
                }}
              >
                {category}
              </div>
            </div>
          )}

          <h1
            style={{
              fontSize: titleSize,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.035em",
              margin: 0,
              color: "#f0f0f0",
            }}
          >
            {displayTitle}
          </h1>

          <p
            style={{
              fontSize: 20,
              lineHeight: 1.55,
              color: "rgba(255, 255, 255, 0.40)",
              margin: 0,
              maxWidth: "760px",
            }}
          >
            {displayDesc}
          </p>
        </div>

        {/* Footer: domain + dot accent */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "0.03em",
              color: "rgba(255, 255, 255, 0.22)",
            }}
          >
            loooooop.vercel.app
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#e8650a",
              }}
            />
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "rgba(232, 101, 10, 0.5)",
              }}
            />
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "rgba(232, 101, 10, 0.2)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function GearIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="14" fill="#e8650a" />
      <g transform="translate(32 32) scale(0.4) translate(-64 -60)">
        <path
          d="M103 76A42 42 0 0 1 98 84L107 90A52 52 0 0 1 94 103L88 94A42 42 0 0 1 71 102L72 111A52 52 0 0 1 54 111L56 101A42 42 0 0 1 39 94L33 102A52 52 0 0 1 20 88L29 83A42 42 0 0 1 22 65L12 66A52 52 0 0 1 13 48L23 51A42 42 0 0 1 31 34L24 27A52 52 0 0 1 37 15L42 24A42 42 0 0 1 60 18L60 8A52 52 0 0 1 78 10L75 19A42 42 0 0 1 83 23A7 7 0 0 1 77 35A28 28 0 1 0 90 71A7 7 0 0 1 103 76Z"
          fill="#fff"
        />
        <path
          d="M96.28 33.13 L103.97 26.74 A52 52 0 0 1 108.22 32.64 L99.71 37.90 A42 42 0 0 1 101.51 41.10 L123.83 29.84 A67 67 0 0 1 129.35 45.21 L104.96 50.73 A42 42 0 0 1 105.62 54.34 L115.53 52.99 A52 52 0 0 1 116.00 60.28 L106.00 60.23 A42 42 0 0 0 96.28 33.13Z"
          fill="#fff"
        />
        <circle cx="64" cy="60" r="7" fill="#fff" />
      </g>
    </svg>
  );
}
