import prisma from '../prisma'
import { CreateEventInput } from './schemas'

/**
 * Create a new event
 * @param data - Event creation data
 * @returns Created event
 */
export async function createEvent(data: CreateEventInput) {
  const eventData = {
    name: data.name,
    slug: data.slug,
    email: data.email,
    maxUploadsPerGuest: data.maxUploadsPerGuest ?? 6,
    ...(data.image !== undefined && { image: data.image }),
  };
  return prisma.event.create({
    data: eventData,
  })
}

/**
 * Get an event by its slug
 * @param slug - Event slug
 * @returns Event or null if not found
 */
export async function getEventBySlug(slug: string) {
  return prisma.event.findUnique({
    where: { slug },
  })
}

/**
 * Get an event with all its uploads
 * @param id - Event ID
 * @returns Event with uploads array and unique guest count
 */
export async function getEventWithUploads(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      uploads: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (event === null) {
    return null
  }

  const uniqueGuests = await prisma.upload.findMany({
    where: { eventId: id },
    select: { guestToken: true },
    distinct: ["guestToken"],
  })

  return {
    ...event,
    uniqueGuestCount: uniqueGuests.length,
  }
}

/**
 * Get all events ordered by creation date with upload counts
 * @returns Array of all events with upload counts
 */
export async function getAllEvents() {
  return prisma.event.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { uploads: true } },
    },
  })
}

/**
 * Update an event
 * @param id - Event ID
 * @param data - Partial event data to update
 * @returns Updated event
 */
export async function updateEvent(id: string, data: Partial<CreateEventInput>) {
  return prisma.event.update({
    where: { id },
    data,
  })
}

/**
 * Delete an event and all its uploads
 * @param id - Event ID
 * @returns Deleted event
 */
export async function deleteEvent(id: string) {
  return prisma.event.delete({
    where: { id },
  })
}