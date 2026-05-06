import { z } from "zod"

export const createEventFormSchema = z.object({
  eventName: z.string().min(3, "Name must be at least 3 characters").max(80),
  email: z.string().email("Invalid email address"),
  maxUploadsPerGuest: z
    .number({ invalid_type_error: "Must be a number" })
    .int()
    .min(1, "Minimum 1")
    .max(50, "Maximum 50"),
})

export type CreateEventFormValues = z.infer<typeof createEventFormSchema>
