import prisma from "../prisma"

export interface RateLimitEntry {
  key: string
  count: number
  resetAt: Date
}

/**
 * Get a rate limit entry by key
 */
export async function getRateLimit(key: string): Promise<RateLimitEntry | null> {
  const entry = await prisma.rateLimit.findUnique({
    where: { key },
  })

  if (!entry) return null

  return {
    key: entry.key,
    count: entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Increment rate limit for a key
 * Creates new entry if doesn't exist
 * Returns the current count after increment and remaining reset time
 */
export async function incrementRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; count: number; retryAfter?: number }> {
  const now = new Date()
  const resetAt = new Date(now.getTime() + windowMs)

  // Use transaction to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimit.findUnique({
      where: { key },
    })

    if (!existing || now > existing.resetAt) {
      // Create or reset entry
      await tx.rateLimit.upsert({
        where: { key },
        update: { count: 1, resetAt },
        create: { key, count: 1, resetAt },
      })
      return { allowed: true, count: 1 }
    }

    if (existing.count >= maxRequests) {
      const retryAfter = Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000)
      return { allowed: false, count: existing.count, retryAfter }
    }

    // Increment count
    const updated = await tx.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    })

    return { allowed: true, count: updated.count }
  })

  return result
}

/**
 * Delete a rate limit entry (for cleanup or manual reset)
 */
export async function deleteRateLimit(key: string): Promise<boolean> {
  const result = await prisma.rateLimit.delete({
    where: { key },
  })
  return !!result
}

/**
 * Cleanup stale rate limit entries (entries where resetAt has passed)
 * Returns number of entries deleted
 */
export async function cleanupStaleRateLimits(): Promise<number> {
  const now = new Date()
  const result = await prisma.rateLimit.deleteMany({
    where: { resetAt: { lt: now } },
  })
  return result.count
}

/**
 * Get all rate limit entries (for admin/debugging)
 */
export async function getAllRateLimits(): Promise<RateLimitEntry[]> {
  const entries = await prisma.rateLimit.findMany({
    orderBy: { resetAt: "desc" },
  })
  return entries.map((e) => ({
    key: e.key,
    count: e.count,
    resetAt: e.resetAt,
  }))
}
