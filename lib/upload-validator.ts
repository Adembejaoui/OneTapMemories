export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const

export const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"]
export const MAX_FILE_SIZE_MB = 10
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export function validateFileType(file: File): { valid: boolean; error?: string } {
  const mime = file.type
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""

  if (!ALLOWED_MIME_TYPES.includes(mime as any)) {
    return { valid: false, error: `File type ${mime} is not allowed` }
  }
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `File extension .${ext} is not allowed` }
  }
  return { valid: true }
}

export function validateFileSize(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`,
    }
  }
  return { valid: true }
}