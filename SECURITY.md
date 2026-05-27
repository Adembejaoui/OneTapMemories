# Upload & Storage Security Implementation

## Security Vulnerabilities Found

### 1. File Type Validation Weaknesses
- **Original**: Only checked MIME type and extension, which can be spoofed
- **Fix**: Added magic byte validation to verify actual file content matches extension
- **File**: `lib/upload-validator.ts` - added `validateFileContent()` function

### 2. Filename Sanitization Missing
- **Original**: Filenames passed directly to storage without sanitization
- **Fix**: Added `validateFilename()` function to prevent path traversal and special characters
- **Attack prevented**: `../../../etc/passwd` style attacks, null byte injection

### 3. No File Size Validation on Server for Signed URLs
- **Original**: File sizes only validated client-side
- **Fix**: Added `fileSizes` parameter to `/api/upload/url` endpoint with server-side validation
- **Limit**: Max 15MB per file, 50MB total per request

### 4. Public Bucket Access
- **Original**: Files stored in public bucket with direct URLs
- **Fix**: 
  - Created `/api/downloads` endpoint with signed URLs
  - Added SQL policies to restrict public access
  - Signed URLs expire in 60 seconds (configurable)

### 5. Rate Limiting Gaps
- **Original**: Rate limiting existed but had inconsistent coverage
- **Fix**: Added rate limiting to all endpoints:
  - `/api/upload/url`: 30 req/10min per IP
  - `/api/uploads` (POST): 20 req/1min per IP  
  - `/api/uploads` (GET): 60 req/1min per IP
  - `/api/downloads`: 120 req/1min per IP

### 6. Upload Limit Bypass
- **Original**: Could upload more files than limit by changing filenames
- **Fix**: Added `eventId` validation in upload records to ensure files belong to correct event

### 7. No Storage Path Validation
- **Original**: Storage path constructed from user input without validation
- **Fix**: Added path format validation in download endpoint to prevent directory traversal

## Updated Supabase Policies (`supabase/storage-policies.sql`)

```sql
-- Storage bucket should be PRIVATE (not public)
-- These policies enforce signed URL access only

CREATE POLICY "Storage downloads require signed URLs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'events' AND auth.role() = 'service_role'
);

CREATE POLICY "Only signed uploads allowed"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'events' AND auth.role() = 'service_role'
);

CREATE POLICY "Prevent file updates"
ON storage.objects FOR UPDATE
USING (false);

CREATE POLICY "Only admin can delete uploads"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'events' AND auth.role() = 'service_role'
);
```

## Upload Validation Improvements

### Client-Side (`components/guest/GuestUploadPage.tsx`)
- Validates MIME type and extension
- Validates file size before upload
- Passes file sizes to server for verification
- Concurrent upload limiting (3 files at a time)
- Retry logic with exponential backoff

### Server-Side (`app/api/upload/url/route.ts`)
- Validates event exists and guest hasn't exceeded limits
- Sanitizes filenames
- Validates file extensions
- Checks total upload size
- Generates cryptographically secure storage paths
- Creates time-limited signed upload URLs (10 min expiry)

### File Content Validation (`lib/upload-validator.ts`)
- Magic byte checking for JPEG, PNG, WebP, GIF
- Prevents MIME-type spoofing attacks
- Async function callable during upload process

## Signed URL Implementation

### Download Endpoint (`app/api/downloads/route.ts`)
- **Method**: GET with `path` parameter
- **Validation**: Storage path format checking
- **Expiry**: 60 seconds (short enough to prevent sharing, long enough for viewing)
- **Rate limit**: 120 requests/minute per IP

### Usage in Frontend
```javascript
// Get signed URL for a file
const res = await fetch(`/api/downloads?path=${encodeURIComponent(storagePath)}`);
const { downloadUrl } = await res.json();
```

## Abuse Prevention Strategies

### 1. Rate Limiting
- IP-based rate limiting on all upload endpoints
- Configurable limits via `lib/rate-limit.ts`
- Rate limit data stored in database with cleanup

### 2. Upload Quantity Limits
- Per-guest limit enforced via `maxUploadsPerGuest` event field
- Checked before generating signed URLs AND before saving records
- Prevents quota bypass via multiple requests

### 3. Concurrent Upload Throttling
- Client-side: MAX_CONCURRENT_UPLOADS = 3
- Prevents bandwidth exhaustion

### 4. File Size Limits
- Individual: 10MB max
- Total per request: 50MB
- Enforced both client and server side

### 5. Filename Sanitization
- Prevents special characters that could be exploited
- Validates against path traversal patterns

## Guest Limitation Recommendations

### Current Implementation
- Guest tokens are UUIDs stored in sessionStorage (survives page refresh)
- Per-event upload limits via `maxUploadsPerGuest` (default 10)
- No authentication required - designed for open events

### Optional Enhancements
1. **Time-based limits**: Add hourly/daily upload quotas
2. **IP-based duplicate detection**: Prevent same IP uploading too many files
3. **Secret token in URL**: Add secure hash to event URLs for verification
4. **CAPTCHA**: For high-volume abuse prevention
5. **File content scanning**: Integrate with malware scanning service

## Deployment Checklist

1. [ ] Set Supabase `events` bucket to PRIVATE in dashboard
2. [ ] Run SQL policies in Supabase SQL editor
3. [ ] Set environment variable `SUPABASE_SERVICE_ROLE_KEY` (required for signed URLs)
4. [ ] Configure bucket size limits in Supabase (10MB per file)
5. [ ] Enable Supabase storage audit logging
6. [ ] Set up monitoring for rate limit breaches

## Security Headers (Recommended for Vercel)

Add to `vercel.json` or middleware:
```json
{
  "headers": [
    {
      "source": "/api/(uploads|upload|downloads)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Content-Security-Policy", "value": "default-src 'none'" }
      ]
    }
  ]
}
```