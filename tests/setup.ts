import "@testing-library/jest-dom"
import { vi } from "vitest"

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}))

// Mock window.crypto.getRandomValues for deterministic tests
Object.defineProperty(window, "crypto", {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    },
    randomUUID: () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === "x" ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    },
    timingSafeEqual: (a: ArrayBuffer, b: ArrayBuffer) => {
      if (a.byteLength !== b.byteLength) return false
      const aArr = new Uint8Array(a)
      const bArr = new Uint8Array(b)
      for (let i = 0; i < aArr.length; i++) {
        if (aArr[i] !== bArr[i]) return false
      }
      return true
    },
  },
})
