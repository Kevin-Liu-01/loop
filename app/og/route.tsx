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
    { width: OG_WIDTH, height: OG_HEIGHT }
  );
}

type OgCardProps = {
  title: string;
  description: string;
  category: string | null;
};

function OgCard({ title, description, category }: OgCardProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "56px 64px",
        background: "linear-gradient(152deg, #0a0a09 0%, #1a0f0a 44%, #4a2618 100%)",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <GearIcon />
        <span
          style={{
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "-0.03em",
            color: "#fff",
          }}
        >
          {SITE_NAME}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "900px",
        }}
      >
        {category && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "#e8650a",
                background: "rgba(232, 101, 10, 0.12)",
                padding: "4px 12px",
                borderRadius: "4px",
              }}
            >
              {category}
            </div>
          </div>
        )}
        <h1
          style={{
            fontSize: title.length > 60 ? 40 : 52,
            fontWeight: 600,
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            margin: 0,
            color: "#f5f5f5",
          }}
        >
          {title.length > 90 ? `${title.slice(0, 87)}...` : title}
        </h1>
        <p
          style={{
            fontSize: 22,
            lineHeight: 1.5,
            color: "rgba(255, 255, 255, 0.55)",
            margin: 0,
          }}
        >
          {description.length > 160 ? `${description.slice(0, 157)}...` : description}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 16, color: "rgba(255, 255, 255, 0.3)" }}>
          loooooop.vercel.app
        </span>
        <div
          style={{
            width: 48,
            height: 4,
            borderRadius: 2,
            background: "linear-gradient(90deg, #e8650a, rgba(232, 101, 10, 0.3))",
          }}
        />
      </div>
    </div>
  );
}

function GearIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="16" fill="#e8650a" />
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
