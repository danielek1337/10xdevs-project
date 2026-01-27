/**
 * Auth Validators
 *
 * Zod schemas for authentication-related data validation.
 * Shared between client-side and server-side validation.
 */

import { z } from "zod";

// Email validation schema
export const emailSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .max(255, "Email is too long"),
});

// Password validation schema
export const passwordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password is too long") // Bcrypt limit
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema.shape.email,
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().default(false),
});

// Signup schema
export const signupSchema = emailSchema.merge(passwordSchema);

// Forgot password schema
export const forgotPasswordSchema = emailSchema;

// Reset password schema
export const resetPasswordSchema = passwordSchema;

// Type exports
export type LoginDTO = z.infer<typeof loginSchema>;
export type SignupDTO = z.infer<typeof signupSchema>;
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;

