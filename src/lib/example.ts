/**
 * Example utility functions for demonstration
 * These are simple examples to show how to write and test utility functions
 */

/**
 * Calculates a simple focus score based on mood ratings
 * This is a simplified example - real implementation would be more complex
 */
export function calculateFocusScore(moodRatings: number[]): number {
  if (moodRatings.length === 0) {
    return 0;
  }

  const average = moodRatings.reduce((sum, mood) => sum + mood, 0) / moodRatings.length;
  const consistency = 1 - (Math.max(...moodRatings) - Math.min(...moodRatings)) / 5;
  
  return Math.round((average * 0.7 + consistency * 5 * 0.3) * 20);
}

/**
 * Validates if a mood rating is within acceptable range
 */
export function isValidMoodRating(mood: number): boolean {
  return mood >= 1 && mood <= 5 && Number.isInteger(mood);
}

/**
 * Validates task description
 */
export function isValidTaskDescription(task: string): boolean {
  return task.trim().length >= 3;
}

/**
 * Formats timestamp to relative time
 */
export function formatRelativeTime(timestamp: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - timestamp.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);
  
  if (diffInMinutes < 1) {
    return 'just now';
  }
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}

