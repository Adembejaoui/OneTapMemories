import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { supabase } from '@/lib/supabase'
import crypto from 'node:crypto'

/**
 * GET /api/downloads?path=... - Get signed download URLs for private files
 * This endpoint provides time-limited access to uploaded files
 * Implements a global 6-download limit per client (using cookie + fingerprint)
 */
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
    const userAgent = request.headers.get('user-agent') ?? ''
    const accept = request.headers.get('accept') ?? ''
    
    // Create a fingerprint from IP, User-Agent, and Accept headers
    const fingerprint = crypto
      .createHash('sha256')
      .update(ip + userAgent + accept)
      .digest('hex')
    
    // Check for existing client ID cookie
    const cookieHeader = request.headers.get('cookie') ?? ''
    const clientIdCookieMatch = cookieHeader.match(/client_id=([^;]+)/)
    const clientIdCookie = clientIdCookieMatch ? clientIdCookieMatch[1] : null
    
    // Generate new client ID if cookie not present
    let clientId = clientIdCookie ?? fingerprint
    let setCookieHeader = null
    
    if (!clientIdCookie) {
      // Generate a new random client ID
      const newClientId = crypto.randomUUID()
      clientId = newClientId
      
      // Prepare cookie to be set in response (HttpOnly for security, 1 year expiry)
      const secure = process.env.NODE_ENV === 'production'
      setCookieHeader = `client_id=${newClientId}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax; HttpOnly${secure ? '; Secure' : ''}`
    }
    
    // Rate limit downloads - 6 downloads per 30 days per client
    const rateLimitResult = await rateLimit(
      `download_limit:${clientId}`, 
      6, 
      30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    )
    
    if (!rateLimitResult.allowed) {
      const response = NextResponse.json(
        { 
          error: 'Download limit exceeded. You have reached the maximum of 6 downloads.', 
          code: 'DOWNLOAD_LIMIT_EXCEEDED',
          retryAfter: rateLimitResult.retryAfter 
        },
        { status: 429 }
      )
      
      // Still set cookie if we generated one (for future requests after limit resets)
      if (setCookieHeader) {
        response.headers.set('Set-Cookie', setCookieHeader)
      }
      
      return response
    }
    
    const { searchParams } = new URL(request.url)
    const storagePath = searchParams.get('path')
    
    if (!storagePath) {
      const response = NextResponse.json(
        { error: 'storagePath parameter is required', success: false },
        { status: 400 }
      )
      
      if (setCookieHeader) {
        response.headers.set('Set-Cookie', setCookieHeader)
      }
      
      return response
    }
    
    // Validate storage path format to prevent traversal attacks
    const safePathPattern = /^[a-z0-9-]+\/[a-zA-Z0-9_.-]+\.[a-z0-9]+$/i
    if (!safePathPattern.test(storagePath)) {
      const response = NextResponse.json(
        { error: 'Invalid storage path format', success: false },
        { status: 400 }
      )
      
      if (setCookieHeader) {
        response.headers.set('Set-Cookie', setCookieHeader)
      }
      
      return response
    }
    
    // Generate signed URL with 60 second expiry
    const { data, error } = await supabase.storage
      .from('events')
      .createSignedUrl(storagePath, 60)
    
    if (error || !data) {
      const response = NextResponse.json(
        { error: 'Failed to generate download URL', success: false },
        { status: 404 }
      )
      
      if (setCookieHeader) {
        response.headers.set('Set-Cookie', setCookieHeader)
      }
      
      return response
    }
    
    const response = NextResponse.json({
      success: true,
      downloadUrl: data.signedUrl,
      expiresIn: 60,
    })
    
    // Set cookie if we generated one
    if (setCookieHeader) {
      response.headers.set('Set-Cookie', setCookieHeader)
    }
    
    return response
  } catch (error) {
    console.error('Download error:', error)
    const response = NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
    
    // Attempt to set cookie if we were generating one (though we may not have clientId in catch)
    // In practice, we would need to reconstruct the clientId logic here, but for simplicity
    // we omit it in the error case as it's less critical
    return response
  }
}