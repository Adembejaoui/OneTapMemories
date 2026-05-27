import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { getEventBySlug } from '@/lib/db/events'
import { countGuestUploads } from '@/lib/db/uploads'
import { supabase } from '@/lib/supabase'
import { MAX_FILE_SIZE_BYTES_STRICT } from '@/lib/upload-validator'

// Function to generate a valid filename from user-provided filename
function generateValidFilename(originalFilename: string): string {
  // Extract extension
  const extMatch = originalFilename.match(/\.([^.]+)$/);
  const ext = extMatch ? extMatch[1].toLowerCase() : '';
  
  // Validate extension
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
  const validExt = allowedExtensions.includes(ext) ? ext : 'jpg';
  
  // Generate filename: timestamp + random string + valid extension
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `upload_${timestamp}_${randomStr}.${validExt}`;
}

const uploadUrlSchema = z.object({
  filenames: z.array(z.string().max(100)).max(20),
  eventSlug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Invalid event slug'),
  guestToken: z.string().uuid(),
  fileSizes: z.array(z.number().positive().max(MAX_FILE_SIZE_BYTES_STRICT)).max(20).optional(),
})

const MAX_TOTAL_UPLOAD_SIZE = 50 * 1024 * 1024 // 50MB total per request

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
    
    // Rate limit uploads - stricter limits for unverified guests
    const rateLimitResult = await rateLimit(`upload:url:${ip}`, 30, 10 * 60 * 1000)
    if (!rateLimitResult.allowed) {
      console.error('Rate limit exceeded for upload URL generation:', { ip, retryAfter: rateLimitResult.retryAfter })
      return NextResponse.json(
        { error: 'Too many requests', code: 'RATE_LIMITED', retryAfter: rateLimitResult.retryAfter },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
      )
    }

    const body = await request.json()
    const parseResult = uploadUrlSchema.safeParse(body)

    if (!parseResult.success) {
      console.error('Invalid request for upload URL generation:', { ip, errors: parseResult.error.issues })
      return NextResponse.json(
        { error: 'Invalid request', code: 'INVALID_INPUT', details: parseResult.error.issues },
        { status: 400 }
      )
    }

    const { filenames, eventSlug, guestToken, fileSizes } = parseResult.data

    // Generate valid filenames for all uploads
    const validFilenames = filenames.map(generateValidFilename)
    
    // Validate total upload size if provided
    if (fileSizes && fileSizes.length === filenames.length) {
      const totalSize = fileSizes.reduce((sum, size) => sum + size, 0)
      if (totalSize > MAX_TOTAL_UPLOAD_SIZE) {
        console.error('Total upload size exceeds limit for upload URL generation:', { ip, totalSize, limit: MAX_TOTAL_UPLOAD_SIZE })
        return NextResponse.json(
          { error: 'Total upload size exceeds limit', code: 'TOTAL_SIZE_EXCEEDED' },
          { status: 400 }
        )
      }
    }

    const event = await getEventBySlug(eventSlug)
    if (!event) {
      console.error('Event not found for upload URL generation:', { ip, eventSlug })
      return NextResponse.json(
        { error: 'Event not found', code: 'EVENT_NOT_FOUND' },
        { status: 404 }
      )
    }
    console.error('Event details for upload limit:', { eventSlug, maxUploadsPerGuest: event.maxUploadsPerGuest })

    const uploadCount = await countGuestUploads(event.id, guestToken)
    console.error('Upload limit check:', { ip, eventSlug, guestToken, uploadCount, requested: filenames.length, limit: event.maxUploadsPerGuest, total: uploadCount + filenames.length })
    if (uploadCount + filenames.length > event.maxUploadsPerGuest) {
      console.error('Upload limit exceeded for upload URL generation:', { ip, eventSlug, guestToken, uploadCount, requested: filenames.length, limit: event.maxUploadsPerGuest })
      return NextResponse.json(
        {
          error: `Upload limit exceeded. You can only upload ${event.maxUploadsPerGuest} files total.`,
          code: 'UPLOAD_LIMIT_EXCEEDED',
          currentCount: uploadCount,
          limit: event.maxUploadsPerGuest,
          remaining: event.maxUploadsPerGuest - uploadCount,
        },
        { status: 429 }
      )
    }
    console.error('Upload URL generation approved:', { ip, eventSlug, guestToken, uploadCount, requested: filenames.length, limit: event.maxUploadsPerGuest, totalAfter: uploadCount + filenames.length })

    const uploadUrls = []
    for (let i = 0; i < validFilenames.length; i++) {
      const filename = validFilenames[i]
      const ext = filename.split('.').pop()?.toLowerCase() ?? ''
      const randomId = crypto.randomUUID()
      // Use unique timestamp per file to ensure uniqueness
      const storagePath = `${event.slug}/${Date.now() + i}-${randomId}.${ext}`

      const { data, error } = await supabase.storage
        .from('events')
        .createSignedUploadUrl(storagePath)

      if (error || !data) {
        console.error('Failed to create upload URL for storage path:', { ip, storagePath, error })
        uploadUrls.push({
          filename: filenames[i],
          success: false,
          error: error?.message ?? 'Failed to create upload URL',
        })
      } else {
        uploadUrls.push({
          filename: filenames[i],
          success: true,
          uploadUrl: data.signedUrl,
          path: storagePath,
          token: data.token,
        })
      }
    }

    const failures = uploadUrls.filter((u: any) => !u.success)
    const successes = uploadUrls.filter((u: any) => u.success)

    return NextResponse.json({
      success: true,
      uploadUrls,
      summary: {
        total: filenames.length,
        succeeded: successes.length,
        failed: failures.length,
      },
    })
  } catch (error) {
    console.error('Upload URL generation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'SERVER_ERROR' },
      { status: 500 }
    )
  }
}