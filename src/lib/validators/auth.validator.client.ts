/**
 * Client-Side Auth Validators
 *
 * Extended Zod schemas for client-side only validation.
 * These schemas include fields like password confirmation that are not sent to the server.
 */

import { z } from "zod";
import { signupSchema, resetPasswordSchema } from "./auth.validator";

/**
 * Client-side signup schema with password confirmation
 * Extends the server-side signup schema with confirmPassword field
 */
export const signupFormSchema = signupSchema
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

/**
 * Client-side reset password schema with password confirmation
 * Extends the server-side reset password schema with confirmPassword field
 */
export const resetPasswordFormSchema = resetPasswordSchema
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// Type exports
export type SignupFormData = z.infer<typeof signupFormSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;
