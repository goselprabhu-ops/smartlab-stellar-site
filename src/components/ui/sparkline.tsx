import { useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * Sparkline — tiny inline SVG trend line. No external dep.
 * Pass a numeric series; component normalizes and renders a smooth path.
 */
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  showArea?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function Sparkline({
  data,
  width = 120,
  height = 36,
  stroke = "currentColor",
  fill,
  showArea = true,
  className,
  ariaLabel = "Trend",
}: SparklineProps) {
  const { linePath, areaPath } = useMemo(() => {
    if (!data.length) return { linePath: "", areaPath: "" };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const stepX = data.length > 1 ? width / (data.length - 1) : width;

    const points = data.map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return [x, y] as const;
    });

    const line = points
      .map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`))
      .join(" ");

    const area = `${line} L ${width} ${height} L 0 ${height} Z`;
    return { linePath: line, areaPath: area };
  }, [data, width, height]);

  if (!data.length) {
    return (
      <div
        className={cn(
          "flex h-9 w-32 items-center justify-center text-[10px] text-muted-foreground",
          className,
        )}
      >
        no data
      </div>
    );
  }

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
    >
      {showArea && (
        <path
          d={areaPath}
          fill={fill ?? "currentColor"}
          opacity={0.12}
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
