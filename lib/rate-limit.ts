import { incrementRateLimit, cleanupStaleRateLimits } from "./db/rate-limit"

/**
 * Rate limit a request
 * @param key - Unique identifier for the rate limit (e.g., IP + route)
 * @param maxRequests - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Object indicating if request is allowed and optional retryAfter seconds
 *
 * @example
 * const result = rateLimit("upload:user-123", 10, 60_000) // 10 requests per minute
 * if (!result.allowed) {
 *   return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": result.retryAfter } })
 * }
 */
export async function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const result = await incrementRateLimit(key, maxRequests, windowMs)
  return {
    allowed: result.allowed,
    retryAfter: result.retryAfter,
  }
}

// Cleanup stale entries every 5 minutes to prevent database bloat
// This uses the database cleanup function instead of Map cleanup
if (typeof window === "undefined") {
  // Only run in Node.js environment (server-side)
  setInterval(async () => {
    try {
      await cleanupStaleRateLimits()
    } catch (error) {
      console.error("Rate limit cleanup error:", error)
    }
  }, 5 * 60 * 1000)
}
