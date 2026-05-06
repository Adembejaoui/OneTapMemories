import { describe, it, expect } from "vitest"
import { cn, generateSlug } from "@/lib/utils"

describe("Utils", () => {
  describe("cn", () => {
    it("should merge class names correctly", () => {
      const result = cn("class1", "class2", "class3")
      expect(result).toBe("class1 class2 class3")
    })

    it("should handle conditional classes", () => {
      const condition = true
      const result = cn("base", condition && "conditional")
      expect(result).toBe("base conditional")
    })

    it("should merge tailwind conflicting classes with tailwind-merge", () => {
      const result = cn("p-4", "p-2")
      expect(result).toBe("p-2") // Later value wins
    })
  })

  describe("generateSlug", () => {
    it("should convert to lowercase", () => {
      expect(generateSlug("Hello World")).toBe("hello-world")
    })

    it("should trim whitespace", () => {
      expect(generateSlug("  test  ")).toBe("test")
    })

    it("should replace spaces with hyphens", () => {
      expect(generateSlug("my event name")).toBe("my-event-name")
    })

    it("should remove special characters", () => {
      expect(generateSlug("Event!@#")).toBe("event")
    })

    it("should collapse multiple hyphens", () => {
      expect(generateSlug("test--multiple---hyphens")).toBe("test-multiple-hyphens")
    })

    it("should truncate to 80 characters", () => {
      const longName = "a".repeat(100)
      const result = generateSlug(longName)
      expect(result.length).toBe(80)
    })
  })
})
