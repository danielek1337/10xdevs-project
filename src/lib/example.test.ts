/**
 * Unit Tests for Example Utility Functions
 * 
 * This demonstrates best practices for unit testing with Vitest:
 * - Descriptive test names
 * - Arrange-Act-Assert pattern
 * - Testing edge cases
 * - Using describe blocks for organization
 */

import { describe, it, expect } from 'vitest';
import {
  calculateFocusScore,
  isValidMoodRating,
  isValidTaskDescription,
  formatRelativeTime,
} from './example';

describe('calculateFocusScore', () => {
  it('should return 0 for empty array', () => {
    // Arrange
    const moodRatings: number[] = [];

    // Act
    const result = calculateFocusScore(moodRatings);

    // Assert
    expect(result).toBe(0);
  });

  it('should calculate score for consistent high ratings', () => {
    // Arrange
    const moodRatings = [5, 5, 5, 5];

    // Act
    const result = calculateFocusScore(moodRatings);

    // Assert
    expect(result).toBeGreaterThan(80);
    expect(result).toBeLessThanOrEqual(100);
  });

  it('should calculate score for consistent low ratings', () => {
    // Arrange
    const moodRatings = [1, 1, 1, 1];

    // Act
    const result = calculateFocusScore(moodRatings);

    // Assert
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(50);
  });

  it('should penalize inconsistent ratings', () => {
    // Arrange
    const consistentRatings = [3, 3, 3, 3];
    const inconsistentRatings = [1, 5, 1, 5];

    // Act
    const consistentScore = calculateFocusScore(consistentRatings);
    const inconsistentScore = calculateFocusScore(inconsistentRatings);

    // Assert
    expect(consistentScore).toBeGreaterThan(inconsistentScore);
  });

  it('should handle single rating', () => {
    // Arrange
    const moodRatings = [4];

    // Act
    const result = calculateFocusScore(moodRatings);

    // Assert
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe('isValidMoodRating', () => {
  it('should return true for valid ratings (1-5)', () => {
    expect(isValidMoodRating(1)).toBe(true);
    expect(isValidMoodRating(2)).toBe(true);
    expect(isValidMoodRating(3)).toBe(true);
    expect(isValidMoodRating(4)).toBe(true);
    expect(isValidMoodRating(5)).toBe(true);
  });

  it('should return false for ratings below 1', () => {
    expect(isValidMoodRating(0)).toBe(false);
    expect(isValidMoodRating(-1)).toBe(false);
  });

  it('should return false for ratings above 5', () => {
    expect(isValidMoodRating(6)).toBe(false);
    expect(isValidMoodRating(10)).toBe(false);
  });

  it('should return false for decimal numbers', () => {
    expect(isValidMoodRating(3.5)).toBe(false);
    expect(isValidMoodRating(4.2)).toBe(false);
  });
});

describe('isValidTaskDescription', () => {
  it('should return true for valid descriptions (3+ chars)', () => {
    expect(isValidTaskDescription('abc')).toBe(true);
    expect(isValidTaskDescription('Working on tests')).toBe(true);
    expect(isValidTaskDescription('Fix bug')).toBe(true);
  });

  it('should return false for descriptions shorter than 3 chars', () => {
    expect(isValidTaskDescription('')).toBe(false);
    expect(isValidTaskDescription('ab')).toBe(false);
    expect(isValidTaskDescription('a')).toBe(false);
  });

  it('should trim whitespace before validation', () => {
    expect(isValidTaskDescription('   ')).toBe(false);
    expect(isValidTaskDescription('  ab  ')).toBe(false);
    expect(isValidTaskDescription('  abc  ')).toBe(true);
  });
});

describe('formatRelativeTime', () => {
  it('should return "just now" for very recent timestamps', () => {
    // Arrange
    const now = new Date();

    // Act
    const result = formatRelativeTime(now);

    // Assert
    expect(result).toBe('just now');
  });

  it('should format minutes correctly', () => {
    // Arrange
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Act
    const result = formatRelativeTime(fiveMinutesAgo);

    // Assert
    expect(result).toBe('5 minutes ago');
  });

  it('should format single minute correctly', () => {
    // Arrange
    const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);

    // Act
    const result = formatRelativeTime(oneMinuteAgo);

    // Assert
    expect(result).toBe('1 minute ago');
  });

  it('should format hours correctly', () => {
    // Arrange
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    // Act
    const result = formatRelativeTime(threeHoursAgo);

    // Assert
    expect(result).toBe('3 hours ago');
  });

  it('should format days correctly', () => {
    // Arrange
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    // Act
    const result = formatRelativeTime(twoDaysAgo);

    // Assert
    expect(result).toBe('2 days ago');
  });
});

