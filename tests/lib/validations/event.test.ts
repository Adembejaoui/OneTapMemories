import { describe, it, expect } from "vitest"
import { z } from "zod"
import { createEventSchema } from "@/lib/db/schemas"
import { createEventFormSchema } from "@/lib/validations/event"

describe("Validation Schemas", () => {
  describe("createEventSchema", () => {
    it("should accept valid event data", () => {
      const data = {
        name: "Birthday Party",
        slug: "birthday-party",
        email: "test@example.com",
        maxUploadsPerGuest: 10,
      }
      const result = createEventSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

  it("should reject missing name", () => {
    const data = {
      slug: "test",
      email: "test@example.com",
    }
    const result = createEventSchema.safeParse(data)
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toBe("Event name is required")
  })

  it("should reject invalid slug format", () => {
    const data = {
      name: "Test",
      slug: "Invalid Slug With Spaces",
      email: "test@example.com",
    }
    const result = createEventSchema.safeParse(data)
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toContain("lowercase")
  })

  it("should reject invalid email", () => {
    const data = {
      name: "Test",
      slug: "test",
      email: "not-an-email",
    }
    const result = createEventSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("should enforce maxUploadsPerGuest <= 100", () => {
    const data = {
      name: "Test",
      slug: "test",
      email: "test@example.com",
      maxUploadsPerGuest: 101,
    }
    const result = createEventSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
  })

  describe("createEventFormSchema", () => {
    it("should accept valid form data", () => {
      const data = {
        eventName: "My Event",
        email: "organizer@example.com",
        maxUploadsPerGuest: 20,
      }
      const result = createEventFormSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

  it("should reject event name less than 3 characters", () => {
    const data = {
      eventName: "ab",
      email: "test@example.com",
      maxUploadsPerGuest: 10,
    }
    const result = createEventFormSchema.safeParse(data)
    expect(result.success).toBe(false)
    expect(result.error?.errors[0].message).toContain("at least 3")
  })
  })
})
