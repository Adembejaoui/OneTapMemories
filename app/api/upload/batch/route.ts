import { rateLimit } from "@/lib/rate-limit";
import { validateFileType, validateFileSize } from "@/lib/upload-validator";
import { getEventBySlug } from "@/lib/db/events";
import { createUpload, countGuestUploads } from "@/lib/db/uploads";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const batchUploadRequestSchema = z.object({
  eventSlug: z.string().min(1),
  guestToken: z.string().uuid(),
});

type UploadResult = {
  fileName: string;
  success: boolean;
  url?: string;
  error?: string;
  code?: string;
};

export async function POST(request: NextRequest) {
  // 1. Rate limiting by IP (lower frequency for batch requests)
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateLimitResult = await rateLimit(`upload:batch:${ip}`, 10, 10 * 60 * 1000); // 10 batch requests per 10 minutes
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMITED", retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter) } }
    );
  }

  // 2. Parse formData
  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const eventSlug = formData.get("eventSlug") as string | null;
  const guestToken = formData.get("guestToken") as string | null;

  // 3. Validate eventSlug and guestToken
  const parseResult = batchUploadRequestSchema.safeParse({ eventSlug, guestToken });
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid request", code: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  const { eventSlug: validatedEventSlug, guestToken: validatedGuestToken } = parseResult.data;

  // 4. Validate files exist
  if (!files || files.length === 0) {
    return NextResponse.json(
      { error: "No files provided", code: "NO_FILES" },
      { status: 400 }
    );
  }

  // Ensure all are File instances
  const validFiles = files.filter(f => f instanceof File);
  if (validFiles.length !== files.length) {
    return NextResponse.json(
      { error: "All items must be valid files", code: "INVALID_FILES" },
      { status: 400 }
    );
  }

  // 5. Get event by slug
  const event = await getEventBySlug(validatedEventSlug);
  if (!event) {
    return NextResponse.json(
      { error: "Event not found", code: "EVENT_NOT_FOUND" },
      { status: 404 }
    );
  }

  // 6. Check guest upload limit (total current + new files)
  const uploadCount = await countGuestUploads(event.id, validatedGuestToken);
  const totalAfterUpload = uploadCount + validFiles.length;
  if (totalAfterUpload > event.maxUploadsPerGuest) {
    return NextResponse.json(
      {
        error: `Upload limit exceeded. You can only upload ${event.maxUploadsPerGuest} files total.`,
        code: "UPLOAD_LIMIT_EXCEEDED",
        currentCount: uploadCount,
        limit: event.maxUploadsPerGuest,
        attempted: validFiles.length,
      },
      { status: 429 }
    );
  }

  // 7. Validate all files (type and size) before any upload
  const validationErrors: { fileName: string; error: string }[] = [];
  for (const file of validFiles) {
    const typeValidation = validateFileType(file);
    if (!typeValidation.valid) {
      validationErrors.push({ fileName: file.name, error: typeValidation.error || "Invalid file type" });
      continue;
    }

    const sizeValidation = validateFileSize(file);
    if (!sizeValidation.valid) {
      validationErrors.push({ fileName: file.name, error: sizeValidation.error || "File too large" });
    }
  }

  if (validationErrors.length > 0) {
    return NextResponse.json(
      {
        error: "File validation failed",
        code: "VALIDATION_FAILED",
        failures: validationErrors,
      },
      { status: 400 }
    );
  }

  // 8. Upload all files to Supabase concurrently
  const uploadPromises = validFiles.map(async (file) => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const path = `${event.slug}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from("events")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (storageError) {
      return { fileName: file.name, success: false, error: storageError.message, code: "STORAGE_ERROR" };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage.from("events").getPublicUrl(path);

    return { fileName: file.name, success: true, url: publicUrl };
  });

  const uploadResults = await Promise.all(uploadPromises);

  // 9. Create database records for successful uploads
  const successfulResults = uploadResults.filter(r => r.success);
  const dbCreatePromises = successfulResults.map(result =>
    createUpload({
      eventId: event.id,
      url: result.url!,
      guestToken: validatedGuestToken,
    })
  );

  await Promise.all(dbCreatePromises);

  // 10. Return results
  return NextResponse.json(
    {
      success: true,
      results: uploadResults,
      summary: {
        total: validFiles.length,
        succeeded: successfulResults.length,
        failed: validationErrors.length + uploadResults.filter(r => !r.success).length,
      },
    },
    { status: 200 }
  );
}
