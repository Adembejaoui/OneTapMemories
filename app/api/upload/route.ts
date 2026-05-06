import { rateLimit } from "@/lib/rate-limit";
import { validateFileType, validateFileSize } from "@/lib/upload-validator";
import { getEventBySlug } from "@/lib/db/events";
import { createUpload, countGuestUploads } from "@/lib/db/uploads";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const uploadRequestSchema = z.object({
  eventSlug: z.string().min(1),
  guestToken: z.string().uuid(),
});

export async function POST(request: NextRequest) {
   // 1. Rate limiting by IP
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateLimitResult = await rateLimit(`upload:single:${ip}`, 20, 10 * 60 * 1000); // 20 requests per 10 minutes
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMITED", retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter) } }
    );
  }

   // 2. Parse formData
   const formData = await request.formData();
   const file = formData.get("file") as File | null;
   const eventSlug = formData.get("eventSlug") as string | null;
   const guestToken = formData.get("guestToken") as string | null;

   // 3. Validate eventSlug and guestToken
   const parseResult = uploadRequestSchema.safeParse({ eventSlug, guestToken });
   if (!parseResult.success) {
     return NextResponse.json(
       { error: "Invalid request", code: "INVALID_INPUT" },
       { status: 400 }
     );
   }

   // Extract validated values
   const { eventSlug: validatedEventSlug, guestToken: validatedGuestToken } = parseResult.data;

   // 4. Validate file exists and is a File instance
   if (!file || !(file instanceof File)) {
     return NextResponse.json(
       { error: "No file provided", code: "NO_FILE" },
       { status: 400 }
     );
   }

   // 5. Validate file type and size
   const typeValidation = validateFileType(file);
   if (!typeValidation.valid) {
     return NextResponse.json(
       { error: typeValidation.error, code: "INVALID_FILE_TYPE" },
       { status: 415 }
     );
   }

   const sizeValidation = validateFileSize(file);
   if (!sizeValidation.valid) {
     return NextResponse.json(
       { error: sizeValidation.error, code: "FILE_TOO_LARGE" },
       { status: 413 }
     );
   }

   // 6. Get event by slug
   const event = await getEventBySlug(validatedEventSlug);
   if (!event) {
     return NextResponse.json(
       { error: "Event not found", code: "EVENT_NOT_FOUND" },
       { status: 404 }
     );
   }

   // 7. Check guest upload limit
   const uploadCount = await countGuestUploads(event.id, validatedGuestToken);
   if (uploadCount >= event.maxUploadsPerGuest) {
     return NextResponse.json(
       { error: "Upload limit reached", code: "UPLOAD_LIMIT_REACHED" },
       { status: 429 }
     );
   }

   // 8. Build storage path and upload to Supabase
   const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
   const path = `${event.slug}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error: storageError } = await supabase.storage
    .from("events")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (storageError) {
    return NextResponse.json(
      { error: "Storage error", code: "STORAGE_ERROR" },
      { status: 500 }
    );
  }

  // 9. Get public URL
  const { data: { publicUrl } } = supabase.storage.from("events").getPublicUrl(path);

   // 10. Create upload record
   await createUpload({ eventId: event.id, url: publicUrl, guestToken: validatedGuestToken });

  // 11. Return success
  return NextResponse.json({ success: true, url: publicUrl }, { status: 200 });
}