import { NextRequest, NextResponse } from 'next/server'
import { createUpload, countGuestUploads, getEventWithUploads } from 'lib/db'
import { validateCreateUpload } from 'lib/db/schemas'

/**
 * POST /api/uploads - Create a new upload
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const eventId = formData.get('eventId') as string
    const url = formData.get('url') as string
    const guestToken = formData.get('guestToken') as string

    // Validate input
    const validatedData = validateCreateUpload({ eventId, url, guestToken })

    // Check guest upload count against event limit
    const event = await getEventWithUploads(eventId)
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found', success: false },
        { status: 404 }
      )
    }

    const guestUploadCount = await countGuestUploads(eventId, guestToken)
    if (guestUploadCount >= event.maxUploadsPerGuest) {
      return NextResponse.json(
        {
          error: 'Upload limit reached for this guest',
          limit: event.maxUploadsPerGuest,
          success: false,
        },
        { status: 429 }
      )
    }

    // Create upload
    const upload = await createUpload(validatedData)

    return NextResponse.json(
      { data: upload, success: true },
      { status: 201 }
    )
  } catch (error: any) {
    if (error?.issues) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues, success: false },
        { status: 400 }
      )
    }

    console.error('Upload creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create upload', success: false },
      { status: 500 }
    )
  }
}

/**
 * GET /api/uploads?eventId=... - Get uploads for an event
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId parameter is required', success: false },
        { status: 400 }
      )
    }

    const { getUploadsByEvent } = await import('lib/db/uploads')
    const uploads = await getUploadsByEvent(eventId)

    return NextResponse.json({ data: uploads, success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch uploads', success: false },
      { status: 500 }
    )
  }
}