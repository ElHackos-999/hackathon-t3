import { z } from "zod/v4";

/**
 * Ethereum address validation
 */
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address");

/**
 * Course code validation (alphanumeric, 2-20 characters)
 */
export const courseCodeSchema = z
  .string()
  .min(2, "Course code must be at least 2 characters")
  .max(20, "Course code must be at most 20 characters")
  .regex(/^[A-Z0-9_-]+$/, "Course code must be uppercase alphanumeric");

/**
 * Course name validation (2-100 characters)
 */
export const courseNameSchema = z
  .string()
  .min(2, "Course name must be at least 2 characters")
  .max(100, "Course name must be at most 100 characters");

/**
 * Image URI validation
 */
export const imageURISchema = z
  .string()
  .min(1, "Image URI is required");

/**
 * Allowed image MIME types
 */
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/svg+xml",
] as const;

/**
 * Maximum file size (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Schema for validating uploaded image files
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      error: "File must be JPEG, PNG, GIF, or SVG",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

/**
 * Validity duration validation (1 day to 10 years in seconds)
 */
export const validityDurationSchema = z
  .bigint()
  .min(BigInt(86400), "Duration must be at least 1 day (86400 seconds)")
  .max(
    BigInt(315360000),
    "Duration must be at most 10 years (315360000 seconds)",
  );

/**
 * Schema for creating a new course
 */
export const createCourseSchema = z.object({
  courseCode: courseCodeSchema,
  courseName: courseNameSchema,
  imageURI: imageURISchema,
  validityDuration: validityDurationSchema,
});

/**
 * Schema for updating an existing course
 */
export const updateCourseSchema = z.object({
  tokenId: z.bigint().min(BigInt(1), "Token ID must be at least 1"),
  courseName: courseNameSchema.optional(),
  imageURI: imageURISchema.optional(),
  validityDuration: validityDurationSchema.optional(),
});

/**
 * Schema for minting a certification
 */
export const mintCertificationSchema = z.object({
  to: ethereumAddressSchema,
  tokenId: z.bigint().min(BigInt(1), "Token ID must be at least 1"),
});

/**
 * Schema for batch minting certifications
 */
export const batchMintCertificationsSchema = z.object({
  recipients: z
    .array(ethereumAddressSchema)
    .min(1, "At least one recipient is required")
    .max(100, "Cannot mint to more than 100 recipients at once"),
  tokenId: z.bigint().min(BigInt(1), "Token ID must be at least 1"),
});

/**
 * Type exports for use in server actions
 */
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;
export type MintCertificationInput = z.infer<typeof mintCertificationSchema>;
export type BatchMintCertificationsInput = z.infer<
  typeof batchMintCertificationsSchema
>;
