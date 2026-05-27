import { NextRequest, NextResponse } from 'next/server'
import { createUpload, countGuestUploads, getEventWithUploads } from 'lib/db'
import { validateCreateUpload } from 'lib/db/schemas'
import { rateLimit } from '@/lib/rate-limit'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// Schema for validating upload completion with tokens
const uploadCompleteSchema = z.object({
  eventId: z.string().uuid(),
  uploads: z.array(z.object({
    url: z.string().url(),
    token: z.string().optional(),
    path: z.string().optional(),
    guestToken: z.string().uuid().optional(),
  })),
  guestToken: z.string().uuid(),
})

// Allowed storage MIME types for verification
const ALLOWED_STORAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

type BulkUploadInput = {
  eventId: string
  url: string
  guestToken: string
}

/**
 * POST /api/uploads - Create upload records (called after successful uploads)
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
    
    const body = await request.json()
    
    // Handle bulk upload creation
    if (Array.isArray(body.uploads)) {
      const eventId = body.eventId as string
      const guestToken = body.guestToken as string
      
      if (!eventId || !guestToken) {
        return NextResponse.json(
          { error: 'eventId and guestToken required', success: false },
          { status: 400 }
        )
      }

      // Rate limit bulk uploads
      const rateLimitResult = await rateLimit(`uploads:bulk:${ip}`, 20, 60 * 1000)
      if (!rateLimitResult.allowed) {
        return NextResponse.json(
          { error: 'Too many upload requests', code: 'RATE_LIMITED', retryAfter: rateLimitResult.retryAfter },
          { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
        )
      }

      const event = await getEventWithUploads(eventId)
      if (!event) {
        return NextResponse.json(
          { error: 'Event not found', success: false },
          { status: 404 }
        )
      }

      const guestUploadCount = await countGuestUploads(eventId, guestToken)
      // FIXED: Account for new uploads in limit check
      if (guestUploadCount + body.uploads.length > event.maxUploadsPerGuest) {
        return NextResponse.json(
          {
            error: 'Upload limit reached for this guest',
            limit: event.maxUploadsPerGuest,
            success: false,
          },
          { status: 429 }
        )
      }

      const validatedUploads: BulkUploadInput[] = []
      const urlErrors: string[] = []

      for (const upload of body.uploads) {
        try {
          // Validate URL format
          const validated = validateCreateUpload({ 
            eventId, 
            url: upload.url, 
            guestToken: upload.guestToken ?? guestToken 
          })
          
          // Verify the URL points to our storage bucket - strict check
          const urlObj = new URL(upload.url)
          if (!urlObj.pathname.startsWith('/storage/v1/object/public/events/')) {
            urlErrors.push(`Invalid storage URL: ${upload.url}`)
            continue
          }
          
          // Extract path from URL and verify file exists in storage
          const pathMatch = urlObj.pathname.match(/\/object\/public\/events\/(.+)$/)
          if (!pathMatch) {
            urlErrors.push(`Malformed storage URL: ${upload.url}`)
            continue
          }
          
          const storagePath = pathMatch[1]
          
          // Verify file exists in storage via head request
          const { error: fileError } = await supabase.storage
            .from('events')
            .download(storagePath)
          
          if (fileError) {
            urlErrors.push(`File not found in storage: ${upload.url}`)
            continue
          }
          
          validatedUploads.push(validated)
        } catch (e) {
          urlErrors.push(`Invalid upload data`)
        }
      }

      const createdUploads = await Promise.all(
        validatedUploads.map(u => createUpload(u))
      )

      return NextResponse.json(
        { data: createdUploads, success: true, urlErrors: urlErrors.length > 0 ? urlErrors : undefined },
        { status: 201 }
      )
    }
    
    // Single upload creation
    const formData = await request.json()
    const eventId = formData.eventId as string
    const url = formData.url as string
    const guestToken = formData.guestToken as string

    const validatedData = validateCreateUpload({ eventId, url, guestToken })

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
 * Requires authentication check for private events or signed URLs
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    const guestToken = searchParams.get('guestToken')

    if (!eventId) {
      return NextResponse.json(
        { error: 'eventId parameter is required', success: false },
        { status: 400 }
      )
    }

    // Rate limit downloads
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
    const rateLimitResult = await rateLimit(`uploads:get:${ip}`, 60, 60 * 1000)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests', code: 'RATE_LIMITED', retryAfter: rateLimitResult.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
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