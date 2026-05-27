import { rateLimit } from "@/lib/rate-limit";
import { validateFileType, validateFileSize } from "@/lib/upload-validator";
import { getEventBySlug } from "@/lib/db/events";
import { countGuestUploads } from "@/lib/db/uploads";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const uploadRequestSchema = z.object({
  eventSlug: z.string().min(1),
  guestToken: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const rateLimitResult = await rateLimit(`upload:single:${ip}`, 20, 10 * 60 * 1000);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests", code: "RATE_LIMITED", retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter) } }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const eventSlug = formData.get("eventSlug") as string | null;
  const guestToken = formData.get("guestToken") as string | null;

  const parseResult = uploadRequestSchema.safeParse({ eventSlug, guestToken });
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid request", code: "INVALID_INPUT" },
      { status: 400 }
    );
  }

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file provided", code: "NO_FILE" },
      { status: 400 }
    );
  }

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

  const { eventSlug: validatedEventSlug, guestToken: validatedGuestToken } = parseResult.data;

  const event = await getEventBySlug(validatedEventSlug);
  if (!event) {
    return NextResponse.json(
      { error: "Event not found", code: "EVENT_NOT_FOUND" },
      { status: 404 }
    );
  }

  const uploadCount = await countGuestUploads(event.id, validatedGuestToken);
  if (uploadCount >= event.maxUploadsPerGuest) {
    return NextResponse.json(
      { error: "Upload limit reached - use /api/upload/url for direct client uploads", code: "UPLOAD_LIMIT_REACHED" },
      { status: 429 }
    );
  }

  return NextResponse.json(
    { error: "Use /api/upload/url for direct client uploads", code: "DEPRECATED" },
    { status: 410 }
  );
}