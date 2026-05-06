import { NextRequest, NextResponse } from 'next/server'
import { validateToken, markTokenUsed } from 'lib/db/tokens'
import { getEventBySlug } from 'lib/db/events'

/**
 * POST /api/tokens/validate - Validate and consume a creation token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, slug } = body

    if (!token || !slug) {
      return NextResponse.json(
        { error: 'Token and slug are required', success: false },
        { status: 400 }
      )
    }

    // Validate token
    const tokenRecord = await validateToken(token)
    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired token', success: false },
        { status: 401 }
      )
    }

    // Check if event with slug already exists
    const existingEvent = await getEventBySlug(slug)
    if (existingEvent) {
      return NextResponse.json(
        { error: 'Event with this slug already exists', success: false },
        { status: 409 }
      )
    }

    // Mark token as used
    await markTokenUsed(token)

    return NextResponse.json(
      { 
        data: { valid: true, tokenId: tokenRecord.id },
        success: true 
      }
    )
  } catch (error) {
    console.error('Token validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate token', success: false },
      { status: 500 }
    )
  }
}
 
/**
 * GET /api/tokens/validate?token=... - Check token validity without consuming
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token parameter is required', success: false },
        { status: 400 }
      )
    }

    const tokenRecord = await validateToken(token)

    return NextResponse.json({
      data: { 
        valid: !!tokenRecord,
        expiresAt: tokenRecord?.expiresAt,
      },
      success: true,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to validate token', success: false },
      { status: 500 }
    )
  }
}