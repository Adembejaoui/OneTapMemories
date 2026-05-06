import { NextRequest, NextResponse } from 'next/server'
import { getEventWithUploads, getEventBySlug } from 'lib/db/events'

/**
 * GET /api/events/[id] - Get event by ID with uploads
 * GET /api/events/[slug] - Get event by slug with uploads
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if id looks like a slug (lowercase with hyphens)
    const isSlug = /^[a-z0-9-]+$/.test(id)
    
    let event
    if (isSlug) {
      event = await getEventBySlug(id)
      if (event) {
        // Get full event with uploads
        event = await getEventWithUploads(event.id)
      }
    } else {
      event = await getEventWithUploads(id)
    }

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found', success: false },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: event, success: true })
  } catch (error) {
    console.error('Fetch event error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event', success: false },
      { status: 500 }
    )
  }
}