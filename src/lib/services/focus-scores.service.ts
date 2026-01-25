import type { SupabaseClient } from "../../db/supabase.client";
import type { FocusScoreDTO, FocusScoresQueryParamsDTO } from "../../types";

/**
 * FocusScoresService - Handles focus score calculations and retrieval
 *
 * Features:
 * - Fetch daily focus scores from materialized view
 * - Filter by date range
 * - Transform database view to DTO format
 */
export class FocusScoresService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get focus scores for a user within a date range
   *
   * Queries the v_daily_focus_scores_utc database view which pre-calculates:
   * - Daily Focus Score (0-100)
   * - Component scores (mood, consistency, distribution)
   * - Entry count and time span
   *
   * @param userId - User ID to filter by
   * @param params - Query parameters (date_from, date_to)
   * @returns Array of daily focus scores
   * @throws Error if query fails
   */
  async getFocusScores(userId: string, params: FocusScoresQueryParamsDTO): Promise<FocusScoreDTO[]> {
    const { date_from, date_to } = params;

    // Build query
    let query = this.supabase
      .from("v_daily_focus_scores_utc")
      .select("*")
      .eq("user_id", userId)
      .order("day_utc", { ascending: true });

    // Apply date filters
    if (date_from) {
      query = query.gte("day_utc", date_from);
    }

    if (date_to) {
      query = query.lte("day_utc", date_to);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch focus scores: ${error.message}`);
    }

    // Transform to DTO format
    return (data || []).map((row) => ({
      day: row.day_utc ?? "",
      entry_count: row.entry_count ?? 0,
      avg_mood: row.avg_mood ?? 0,
      first_entry_at: row.first_entry_at ?? row.day_utc ?? "",
      last_entry_at: row.last_entry_at ?? row.day_utc ?? "",
      span_minutes: row.span_minutes ?? 0,
      focus_score: row.focus_score ?? 0,
      components: {
        mood_score: row.mood_score ?? 0,
        consistency_score: row.consistency_score ?? 0,
        distribution_score: row.distribution_score ?? 0,
      },
    }));
  }

  /**
   * Get focus score for a specific day
   *
   * @param userId - User ID
   * @param day - ISO 8601 date string (YYYY-MM-DD)
   * @returns Focus score for the day, or null if no entries
   */
  async getFocusScoreForDay(userId: string, day: string): Promise<FocusScoreDTO | null> {
    const { data, error } = await this.supabase
      .from("v_daily_focus_scores_utc")
      .select("*")
      .eq("user_id", userId)
      .eq("day_utc", day)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch focus score for day: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      day: data.day_utc ?? "",
      entry_count: data.entry_count ?? 0,
      avg_mood: data.avg_mood ?? 0,
      first_entry_at: data.first_entry_at ?? data.day_utc ?? "",
      last_entry_at: data.last_entry_at ?? data.day_utc ?? "",
      span_minutes: data.span_minutes ?? 0,
      focus_score: data.focus_score ?? 0,
      components: {
        mood_score: data.mood_score ?? 0,
        consistency_score: data.consistency_score ?? 0,
        distribution_score: data.distribution_score ?? 0,
      },
    };
  }
}
