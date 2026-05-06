import { EventCreationToken } from '@prisma/client'
import  prisma  from '../prisma'

/**
 * Create a new event creation token
 * @param expiresAt - Optional expiration date
 * @returns Created token
 */
export async function createToken(expiresAt?: Date): Promise<EventCreationToken> {
  const token = crypto.randomUUID()
  const defaultExpiresAt = expiresAt ?? new Date(Date.now() + 1000 * 60 * 60 * 24)
  return prisma.eventCreationToken.create({
    data: {
      token,
      expiresAt: defaultExpiresAt,
    },
  })
}

/**
 * Validate a token - checks existence, usage status, and expiration
 * @param token - Token string to validate
 * @returns Valid token or null if invalid
 */
export async function validateToken(token: string): Promise<EventCreationToken | null> {
  const tokenRecord = await prisma.eventCreationToken.findUnique({
    where: { token },
  })

  if (!tokenRecord) {
    return null
  }

  if (tokenRecord.isUsed) {
    return null
  }

  if (tokenRecord.expiresAt && tokenRecord.expiresAt < new Date()) {
    return null
  }

  return tokenRecord
}

/**
 * Mark a token as used
 * @param token - Token string to mark as used
 * @param usedBy - Optional user ID who consumed the token
 * @returns Updated token or null if not found
 */
export async function markTokenUsed(
  token: string,
  usedBy?: string
): Promise<EventCreationToken | null> {
  return prisma.eventCreationToken.update({
    where: { token },
    data: {
      isUsed: true,
      usedAt: new Date(),
      usedBy: usedBy ?? null,
    },
  })
}

/**
 * Get a token by its string value
 * @param token - Token string
 * @returns Token record or null
 */
export async function getToken(token: string): Promise<EventCreationToken | null> {
  return prisma.eventCreationToken.findUnique({
    where: { token },
  })
}

/**
 * List all tokens
 * @returns Array of all tokens
 */
export async function getAllTokens(): Promise<EventCreationToken[]> {
  return prisma.eventCreationToken.findMany({
    orderBy: { createdAt: 'desc' },
  })
}