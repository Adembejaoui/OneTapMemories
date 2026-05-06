"use server"

import { validateToken, markTokenUsed, getToken } from "lib/db/tokens"
import { createEvent, getEventBySlug } from "lib/db/events"
import { generateSlug } from "lib/utils"
import { createEventFormSchema, CreateEventFormValues } from "lib/validations/event"

export async function createEventAction(
  formData: CreateEventFormValues,
  token: string
): Promise<{
  success: boolean
  slug?: string
  eventUrl?: string
  error?: string
}> {
  // 1. Parse formData with createEventFormSchema.safeParse
  const parsed = createEventFormSchema.safeParse(formData)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors.map((e) => e.message).join(", "),
    }
  }

  // 2. Re-validate token
  const tokenRecord = await validateToken(token)
  if (!tokenRecord) {
    // Determine reason by fetching raw token record
    const tokenRecordRaw = await getToken(token)
    if (!tokenRecordRaw) {
      return { success: false, error: "Token not found" }
    }
    if (tokenRecordRaw.isUsed) {
      return { success: false, error: "Token has already been used" }
    }
    if (tokenRecordRaw.expiresAt && tokenRecordRaw.expiresAt < new Date()) {
      return { success: false, error: "Token has expired" }
    }
    return { success: false, error: "Invalid token" }
  }

  // 3. Generate slug
  let slug = generateSlug(parsed.data.eventName)

  // 4. Check slug uniqueness with max 3 attempts
  let attempts = 0
  const maxAttempts = 3
  while (attempts < maxAttempts) {
    const existing = await getEventBySlug(slug)
    if (!existing) {
      break
    }
    // Slug taken, append random 4-char alphanumeric suffix
    const suffix = Math.random().toString(36).substring(2, 6)
    slug = `${slug}-${suffix}`
    attempts++
  }

  if (attempts >= maxAttempts) {
    return {
      success: false,
      error: "Could not generate a unique slug after 3 attempts",
    }
  }

  // 5. Create event
  const event = await createEvent({
    name: parsed.data.eventName,
    slug,
    email: parsed.data.email,
    maxUploadsPerGuest: parsed.data.maxUploadsPerGuest,
  })

  // 6. Mark token as used
  await markTokenUsed(token)

  // 7. Build eventUrl
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const eventUrl = `${baseUrl}/event/${slug}`

  return { success: true, slug, eventUrl }
}
