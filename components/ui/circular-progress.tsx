import * as React from "react";
import { cn } from "@/lib/utils";
interface CircularProgressProps extends React.SVGAttributes<SVGSVGElement> {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}
function CircularProgress({
  value,
  size = 40,
  strokeWidth = 4,
  label,
  className,
  ...props
}: CircularProgressProps) {
  const normalizedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  return (
    <div
      className="relative inline-flex items-center justify-center"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={normalizedValue}
      aria-label={label}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={cn("-rotate-90", className)}
        {...props}
      >
        <circle
          className="stroke-secondary"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
        />
        <circle
          className="stroke-brand transition-[stroke-dashoffset] duration-300"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (normalizedValue / 100) * circumference}
        />
      </svg>
      <span className="absolute text-xs font-medium">{label ?? `${normalizedValue}%`}</span>
    </div>
  );
}
export { CircularProgress };
