import { z } from 'zod'

// Create Event validation schema
export const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(100),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  email: z.string().email('Invalid email address'),
  image: z.string().url('Invalid image URL').optional().nullable(),
  maxUploadsPerGuest: z.number().int().positive().max(100).default(10),
})

export type CreateEventInput = z.infer<typeof createEventSchema>

// Create Upload validation schema
export const createUploadSchema = z.object({
  eventId: z.string().cuid('Invalid event ID'),
  url: z.string().url('Invalid URL').min(1, 'URL is required'),
  guestToken: z.string().uuid('Guest token must be a valid UUID'),
})

export type CreateUploadInput = z.infer<typeof createUploadSchema>

// Create Token validation schema
export const createTokenSchema = z.object({
  expiresAt: z.date().optional(),
})

export type CreateTokenInput = z.infer<typeof createTokenSchema>

// Validation helper
export function validateCreateEvent(data: unknown) {
  return createEventSchema.parse(data)
}

export function validateCreateUpload(data: unknown) {
  return createUploadSchema.parse(data)
}