import { z } from "zod";

/**
 * Validation schema for creating a new productivity entry
 *
 * Business Rules:
 * - Mood must be an integer between 1 and 5
 * - Task must be at least 3 characters after trimming
 * - Notes are optional
 * - Tags must be lowercase, alphanumeric, 1-20 characters each
 * - Maximum 10 tags allowed per entry
 */
export const createEntrySchema = z.object({
  mood: z
    .number({
      required_error: "Mood is required",
      invalid_type_error: "Mood must be a number",
    })
    .int("Mood must be an integer")
    .min(1, "Mood must be between 1 and 5")
    .max(5, "Mood must be between 1 and 5"),

  task: z
    .string({
      required_error: "Task is required",
      invalid_type_error: "Task must be a string",
    })
    .trim()
    .min(3, "Task must be at least 3 characters"),

  notes: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || null),

  tags: z
    .array(
      z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9]{1,20}$/, "Each tag must be lowercase, alphanumeric, and 1-20 characters")
    )
    .max(10, "Maximum 10 tags allowed")
    .optional()
    .default([])
    .transform((val) => val || []),
});

/**
 * Inferred TypeScript type from the Zod schema
 * Use this for type-safe access to validated input data
 */
export type CreateEntryInput = z.infer<typeof createEntrySchema>;
