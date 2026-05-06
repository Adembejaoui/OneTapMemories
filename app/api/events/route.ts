import { NextRequest, NextResponse } from 'next/server'
import { createEvent, getEventBySlug } from 'lib/db'
import { validateCreateEvent } from 'lib/db/schemas'

/**
 * GET /api/events - List all events
 * POST /api/events - Create a new event
 */
export async function GET() {
  try {
    const { getAllEvents } = await import('lib/db/events')
    const events = await getAllEvents()
    return NextResponse.json({ data: events, success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch events', success: false },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input using Zod schema
    const validatedData = validateCreateEvent(body)
    
    // Create event using data-access layer
    const event = await createEvent(validatedData)
    
    return NextResponse.json(
      { data: event, success: true },
      { status: 201 }
    )
  } catch (error: any) {
    if (error?.issues) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues, success: false },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create event', success: false },
      { status: 500 }
    )
  }
}