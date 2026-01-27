/**
 * FocusScoreWidget Component
 *
 * Displays current Daily Focus Score with breakdown, metrics, and 7-day trend.
 *
 * Features:
 * - Current score display (large number 0-100)
 * - Score breakdown (mood, consistency, distribution)
 * - Key metrics cards (entries, avg mood, span)
 * - 7-day trend chart
 * - Loading state with skeletons
 * - Empty state for new users
 * - Error state with retry
 */

import { TrendingUp, Activity, Clock, Zap } from "lucide-react";
import { TrendChart } from "./TrendChart";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatSpanMinutes } from "@/lib/utils/dashboard.utils";
import { cn } from "@/lib/utils";
import type { FocusScoreDTO } from "@/types";

interface FocusScoreWidgetProps {
  /** Today's focus score data */
  todayScore: FocusScoreDTO | null;
  /** Last 7 days trend data */
  trendData: FocusScoreDTO[];
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error?: string | null;
  /** Callback to retry loading */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Metric card component
 */
function MetricCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: any;
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border bg-card p-3", className)}>
      <div className="rounded-md bg-primary/10 p-2">
        <Icon className="size-4 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

/**
 * Score breakdown component
 */
function ScoreBreakdown({ score }: { score: FocusScoreDTO }) {
  const { mood_score, consistency_score, distribution_score } = score.components;

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="text-center">
        <p className="text-2xl font-bold text-primary">{mood_score.toFixed(0)}</p>
        <p className="text-xs text-muted-foreground">Nastrój</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-primary">{consistency_score.toFixed(0)}</p>
        <p className="text-xs text-muted-foreground">Konsystencja</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-primary">{distribution_score.toFixed(0)}</p>
        <p className="text-xs text-muted-foreground">Rozkład</p>
      </div>
    </div>
  );
}

export function FocusScoreWidget({
  todayScore,
  trendData,
  isLoading,
  error,
  onRetry,
  className,
}: FocusScoreWidgetProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={cn("rounded-lg border bg-card p-6 space-y-4", className)}>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("rounded-lg border bg-card p-6 text-center space-y-4", className)}>
        <p className="text-sm text-destructive">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Spróbuj ponownie
          </Button>
        )}
      </div>
    );
  }

  // Empty state (new user)
  if (!todayScore && trendData.length === 0) {
    return (
      <div className={cn("rounded-lg border bg-card p-6 text-center space-y-2", className)}>
        <div className="rounded-full bg-muted p-4 inline-block mb-2">
          <TrendingUp className="size-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Focus Score</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Stwórz swój pierwszy wpis, aby zobaczyć swój Focus Score i śledzić produktywność!
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border bg-card p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
          Daily Focus Score
        </h2>
        {todayScore && (
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{todayScore.focus_score.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">/ 100</p>
          </div>
        )}
      </div>

      {/* Score breakdown */}
      {todayScore && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Komponenty wyniku</h3>
          <ScoreBreakdown score={todayScore} />
        </div>
      )}

      {/* Metrics cards */}
      {todayScore && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricCard icon={Activity} label="Wpisy" value={todayScore.entry_count} />
          <MetricCard icon={Zap} label="Średni nastrój" value={todayScore.avg_mood.toFixed(1)} />
          <MetricCard icon={Clock} label="Czas pracy" value={formatSpanMinutes(todayScore.span_minutes)} />
        </div>
      )}

      {/* Trend chart */}
      {trendData.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Trend (ostatnie 7 dni)</h3>
          <TrendChart data={trendData} height={200} />
        </div>
      )}
    </div>
  );
}
