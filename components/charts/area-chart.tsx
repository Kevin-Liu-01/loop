"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  smoothPath,
  scaleLinear,
  niceMax,
  findNearestIndex,
  type Point,
} from "./chart-utils";
import { ChartTooltipContent, type TooltipRow } from "./chart-tooltip";

export type AreaChartDatum = {
  label: string;
  value: number;
  secondary?: number;
};

type AreaChartProps = {
  id: string;
  data: AreaChartDatum[];
  height?: number;
  color?: string;
  secondaryColor?: string;
  className?: string;
};

const VB_W = 600;
const VB_H = 180;
const PAD = { top: 12, right: 12, bottom: 28, left: 40 };

export function AreaChart({
  id,
  data,
  height = 180,
  color = "var(--color-accent)",
  secondaryColor = "var(--color-ink-faint)",
  className,
}: AreaChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) return null;

  const allZero = data.every(
    (d) => d.value === 0 && (d.secondary ?? 0) === 0
  );
  if (allZero) {
    return (
      <div
        className={cn(
          "grid place-items-center text-sm text-ink-faint",
          className
        )}
        style={{ minHeight: height * 0.6 }}
      >
        No events in the last 24 hours
      </div>
    );
  }

  const chartW = VB_W - PAD.left - PAD.right;
  const chartH = VB_H - PAD.top - PAD.bottom;
  const allValues = [
    ...data.map((d) => d.value),
    ...data.map((d) => d.secondary ?? 0),
  ];
  const maxVal = niceMax(Math.max(...allValues));

  const xScale = scaleLinear(
    [0, Math.max(1, data.length - 1)],
    [PAD.left, PAD.left + chartW]
  );
  const yScale = scaleLinear([0, maxVal], [PAD.top + chartH, PAD.top]);

  const primaryPoints: Point[] = data.map((d, i) => ({
    x: xScale(i),
    y: yScale(d.value),
  }));
  const primaryPath = smoothPath(primaryPoints);
  const areaPath = `${primaryPath}L${PAD.left + chartW},${PAD.top + chartH}L${PAD.left},${PAD.top + chartH}Z`;

  const hasSecondary = data.some((d) => (d.secondary ?? 0) > 0);
  const secondaryPath = hasSecondary
    ? smoothPath(
        data.map((d, i) => ({ x: xScale(i), y: yScale(d.secondary ?? 0) }))
      )
    : null;

  const yMid = Math.round(maxVal / 2);
  const yTicks = [0, yMid, maxVal];
  const labelStep = Math.max(1, Math.ceil(data.length / 8));
  const gradId = `${id}-grad`;

  const hovered = hoveredIdx !== null ? data[hoveredIdx] : null;
  const hoveredXVb = hoveredIdx !== null ? xScale(hoveredIdx) : 0;
  const tooltipXPct = hoveredIdx !== null ? (hoveredXVb / VB_W) * 100 : 0;

  const tooltipTransform =
    tooltipXPct < 18
      ? "translateX(0)"
      : tooltipXPct > 82
        ? "translateX(-100%)"
        : "translateX(-50%)";

  const tooltipRows: TooltipRow[] = hovered
    ? [
        { label: "total", value: hovered.value, color },
        ...(hasSecondary
          ? [
              {
                label: "api",
                value: hovered.secondary ?? 0,
                color: secondaryColor,
                dashed: true,
              },
            ]
          : []),
      ]
    : [];

  return (
    <div
      className={cn("relative w-full select-none", className)}
      style={{ aspectRatio: `${VB_W} / ${VB_H}`, maxHeight: height }}
      onPointerMove={(e) =>
        setHoveredIdx(
          findNearestIndex(
            e.clientX,
            e.currentTarget.getBoundingClientRect(),
            data.length,
            VB_W,
            xScale
          )
        )
      }
      onPointerLeave={() => setHoveredIdx(null)}
    >
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="100%">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => (
          <line
            key={tick}
            x1={PAD.left}
            y1={yScale(tick)}
            x2={PAD.left + chartW}
            y2={yScale(tick)}
            stroke="var(--color-line)"
            strokeWidth={0.5}
            strokeDasharray="4 4"
          />
        ))}

        <path d={areaPath} fill={`url(#${gradId})`} />

        {secondaryPath && (
          <path
            d={secondaryPath}
            fill="none"
            stroke={secondaryColor}
            strokeWidth={1}
            strokeDasharray="4 3"
            opacity={0.5}
          />
        )}

        <path
          d={primaryPath}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {primaryPoints.map((p, i) =>
          data[i].value > 0 && i !== hoveredIdx ? (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={2.5}
              fill={color}
              opacity={hoveredIdx !== null ? 0.35 : 1}
            />
          ) : null
        )}

        {hoveredIdx !== null && (
          <>
            <line
              x1={hoveredXVb}
              y1={PAD.top}
              x2={hoveredXVb}
              y2={PAD.top + chartH}
              stroke="var(--color-ink-faint)"
              strokeWidth={0.5}
              strokeDasharray="3 2"
              opacity={0.5}
            />
            <circle
              cx={hoveredXVb}
              cy={primaryPoints[hoveredIdx].y}
              r={4}
              fill={color}
              stroke="var(--color-paper)"
              strokeWidth={2}
            />
            {hasSecondary && (data[hoveredIdx].secondary ?? 0) > 0 && (
              <circle
                cx={hoveredXVb}
                cy={yScale(data[hoveredIdx].secondary ?? 0)}
                r={3}
                fill={secondaryColor}
                stroke="var(--color-paper)"
                strokeWidth={1.5}
                opacity={0.7}
              />
            )}
          </>
        )}

        {yTicks.map((tick) => (
          <text
            key={tick}
            x={PAD.left - 6}
            y={yScale(tick) + 3.5}
            textAnchor="end"
            fontSize={10}
            fill="var(--color-ink-faint)"
            fontFamily="var(--font-sans)"
          >
            {tick}
          </text>
        ))}

        {data.map((d, i) =>
          i % labelStep === 0 ? (
            <text
              key={i}
              x={xScale(i)}
              y={PAD.top + chartH + 18}
              textAnchor="middle"
              fontSize={9}
              fill="var(--color-ink-faint)"
              fontFamily="var(--font-sans)"
            >
              {d.label}
            </text>
          ) : null
        )}
      </svg>

      {hoveredIdx !== null && hovered && (
        <div
          className="pointer-events-none absolute top-0 z-10"
          style={{ left: `${tooltipXPct}%`, transform: tooltipTransform }}
        >
          <ChartTooltipContent label={hovered.label} rows={tooltipRows} />
        </div>
      )}
    </div>
  );
}
