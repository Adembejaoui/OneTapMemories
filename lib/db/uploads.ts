import  prisma  from '../prisma'
import { CreateUploadInput } from './schemas'

/**
 * Create a new upload
 * @param data - Upload data
 * @returns Created upload
 */
export async function createUpload(data: CreateUploadInput) {
  return prisma.upload.create({
    data: {
      eventId: data.eventId,
      url: data.url,
      guestToken: data.guestToken,
    },
  })
}

/**
 * Count uploads for a specific guest token within an event
 * Used to enforce maxUploadsPerGuest limit
 * @param eventId - Event ID
 * @param guestToken - Guest token (anonymous fingerprint)
 * @returns Number of uploads for this guest
 */
export async function countGuestUploads(eventId: string, guestToken: string) {
  return prisma.upload.count({
    where: {
      eventId,
      guestToken,
    },
  })
}

/**
 * Get all uploads for an event
 * @param eventId - Event ID
 * @returns Array of uploads
 */
export async function getUploadsByEvent(eventId: string) {
  return prisma.upload.findMany({
    where: { eventId },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get a specific upload by ID
 * @param id - Upload ID
 * @returns Upload or null
 */
export async function getUploadById(id: string) {
  return prisma.upload.findUnique({
    where: { id },
  })
}

/**
 * Delete an upload
 * @param id - Upload ID
 * @returns Deleted upload
 */
export async function deleteUpload(id: string) {
  return prisma.upload.delete({
    where: { id },
  })
}

/**
 * Get upload statistics for an event
 * @param eventId - Event ID
 * @returns Object with total uploads and unique guest count
 */
export async function getUploadStats(eventId: string) {
  const [totalUploads, uniqueGuestRows] = await Promise.all([
    prisma.upload.count({ where: { eventId } }),
    prisma.upload.findMany({
      where: { eventId },
      select: { guestToken: true },
      distinct: ["guestToken"],
    }),
  ])

  return {
    totalUploads,
    uniqueGuests: uniqueGuestRows.length,
  }
}