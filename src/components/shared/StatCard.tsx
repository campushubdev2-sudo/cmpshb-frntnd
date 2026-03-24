import { cn } from "../../lib/utils";
import { Card, CardContent } from "../../components/ui/card";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router";

interface SparklineProps {
  data?: number[];
  color?: string;
  className?: string;
}

function Sparkline({ data = [], color = "var(--color-primary)", className }: SparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const height = 40;
  const width = 120;
  const stepX = width / (data.length - 1);

  const points = data
    .map((v, i) => `${i * stepX},${height - ((v - min) / range) * height}`)
    .join(" ");

  const gradientId = `grad-${color.replace(/[^a-z0-9]/gi, "")}`;
  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  description?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  href?: string;
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  description,
  sparklineData,
  sparklineColor,
  href,
  className,
}: StatCardProps) {
  const content = (
    <Card
      className={cn(
        "group",
        href && "cursor-pointer transition-all duration-200 hover:shadow-md",
        className,
      )}
    >
      <CardContent className="pt-5 pb-5">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-1.5">
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            {href && (
              <ChevronRight className="text-muted-foreground/60 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            )}
          </div>
          {Icon && (
            <div className="bg-primary/10 rounded-lg p-2">
              <Icon className="text-primary h-4 w-4" />
            </div>
          )}
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-bold tracking-tight">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {description && <p className="text-muted-foreground mt-1 text-xs">{description}</p>}
          </div>

          {sparklineData && sparklineData.length >= 2 && (
            <Sparkline
              data={sparklineData}
              color={sparklineColor || "var(--color-primary)"}
              className="h-10 w-28 shrink-0 opacity-80"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
}
