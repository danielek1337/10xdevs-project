/**
 * TrendChart Component
 *
 * Area chart displaying Focus Score trend over the last 7 days.
 *
 * Features:
 * - Recharts AreaChart with gradient fill
 * - XAxis: dates in "dd MMM" format
 * - YAxis: focus_score (0-100)
 * - Tooltip: day, score, entry_count, avg_mood
 * - Responsive container
 * - Smooth animations
 */

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { FocusScoreDTO } from "@/types";

interface TrendChartProps {
  /** Array of focus scores for last 7 days */
  data: FocusScoreDTO[];
  /** Chart height in pixels */
  height?: number;
}

interface TooltipPayload {
  payload: FocusScoreDTO;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

/**
 * Custom tooltip for the chart
 */
function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border bg-popover p-3 shadow-md">
      <p className="text-sm font-medium mb-2">
        {new Date(data.day).toLocaleDateString("pl-PL", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Focus Score:</span>
          <span className="font-semibold">{data.focus_score.toFixed(0)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Wpisy:</span>
          <span className="font-medium">{data.entry_count}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Średni nastrój:</span>
          <span className="font-medium">{data.avg_mood.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}

export function TrendChart({ data, height = 200 }: TrendChartProps) {
  // Transform data for chart
  const chartData = data.map((item) => ({
    ...item,
    // Format date for X axis
    dayFormatted: new Date(item.day).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "short",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="focusScoreGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

        <XAxis dataKey="dayFormatted" tick={{ fontSize: 12 }} className="text-muted-foreground" />

        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} className="text-muted-foreground" />

        <Tooltip content={<CustomTooltip />} />

        <Area
          type="monotone"
          dataKey="focus_score"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#focusScoreGradient)"
          animationDuration={1000}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
