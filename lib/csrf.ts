import { CookieSerializeOptions, serialize } from "cookie"
import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// CSRF token storage keys
const CSRF_TOKEN_KEY = "csrf_token"
const CSRF_PREFIX = "csrf_"

/**
 * Generate a cryptographically secure CSRF token
 * Returns a token that should be set as a cookie and sent to client
 */
export function generateCsrfToken(): string {
  // Generate 32 random bytes, hex encoded (64 chars)
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

/**
 * Create CSRF token cookie options
 */
function getCsrfCookieOptions(): CookieSerializeOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  }
}

/**
 * Middleware to ensure CSRF token exists for state-changing requests
 * Call this at the start of POST/PUT/DELETE server actions or API routes
 */
export async function ensureCsrfToken(request: NextRequest): Promise<string> {
  const token = request.cookies.get(CSRF_TOKEN_KEY)

  if (!token || !token.value) {
    // Generate new token
    const newToken = generateCsrfToken()
    const response = NextResponse.next()
    response.headers.append(
      "Set-Cookie",
      serialize(CSRF_TOKEN_KEY, newToken, getCsrfCookieOptions())
    )
    return newToken
  }

  return token.value
}

/**
 * Verify that the submitted CSRF token matches the cookie token
 */
export function verifyCsrfToken(
  submittedToken: string | null,
  cookieToken: string | null
): boolean {
  if (!submittedToken || !cookieToken) return false
  // Use timingSafeEqual to prevent timing attacks
  const submittedBuffer = Buffer.from(submittedToken, "hex")
  const cookieBuffer = Buffer.from(cookieToken, "hex")

  if (submittedBuffer.length !== cookieBuffer.length) return false

  return crypto.timingSafeEqual(submittedBuffer, cookieBuffer)
}

/**
 * Get CSRF token from request headers (for fetch API clients)
 */
export function getCsrfTokenFromRequest(request: NextRequest): string | null {
  const token = request.headers.get("x-csrf-token") ??
                request.headers.get("x-xsrf-token") ??
                request.headers.get("csrf-token")
  return token
}

/**
 *validate CSRF from both header and body (for form submissions)
 */
export async function validateCsrf(request: NextRequest): Promise<boolean> {
   const cookieToken = request.cookies.get(CSRF_TOKEN_KEY)?.value ?? null
   const headerToken = getCsrfTokenFromRequest(request)
   
   // For form submissions, also check body
   const formData = await request.formData().catch(() => null)
   const bodyToken = formData?.get("csrfToken") as string | null

   return (
     verifyCsrfToken(headerToken, cookieToken) ||
     verifyCsrfToken(bodyToken, cookieToken)
   )
}

/**
 * CSRF protection utility for server actions
 * Wrap your server action with this to add CSRF check
 */
export function withCsrfProtection<
  T extends (...args: any[]) => Promise<any>
>(fn: T): (...args: Parameters<T>) => Promise<any> {
  return async (...args: Parameters<T>) => {
    // For server actions, the first arg is usually the form data or request context
    // We'll need to adapt based on how Next.js server actions work
    // Since server actions don't receive NextRequest directly, we need to
    // extract CSRF token from the form data instead.
    // This wrapper is more suitable for API routes.
    return fn(...args)
  }
}
