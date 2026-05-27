// File type validation with magic byte checking for security
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const

export const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif"]

// Magic bytes for file type verification (prevents MIME type spoofing)
const FILE_SIGNATURES: Record<string, number[][]> = {
  "jpg": [[0xff, 0xd8, 0xff]],
  "png": [[0x89, 0x50, 0x4e, 0x47]],
  "webp": [[0x52, 0x49, 0x46, 0x46]],
  "gif": [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
}

export const MAX_FILE_SIZE_MB = 10
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
export const MAX_FILE_SIZE_BYTES_STRICT = 15 * 1024 * 1024 // Strict limit for signed upload validation

export function validateFilename(filename: string): { valid: boolean; error?: string; sanitized?: string } {
  if (!filename || filename.length > 255) {
    return { valid: false, error: "Invalid filename" }
  }
  
  // Check for path traversal attempts
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\") || filename.includes("\0")) {
    return { valid: false, error: "Invalid filename - special characters not allowed" }
  }

  // Only allow alphanumeric, dash, underscore, dot
  if (!/^[\w\-. ]+$/i.test(filename)) {
    return { valid: false, error: "Filename contains invalid characters" }
  }

  // Sanitize: remove any remaining dangerous characters
  const sanitized = filename.replace(/[^\w\-. ]/g, "_")
  return { valid: true, sanitized }
}

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
  if (file.size === 0) {
    return { valid: false, error: "Empty file not allowed" }
  }
  return { valid: true }
}

// Async validation that checks magic bytes (file content) to prevent spoofing
export async function validateFileContent(file: File): Promise<{ valid: boolean; error?: string }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
  const signatures = FILE_SIGNATURES[ext]
  
  if (!signatures || signatures.length === 0) {
    return { valid: true } // No signatures to validate, but MIME check already passed
  }

  try {
    const arrayBuffer = await file.slice(0, 8).arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    
    const isValid = signatures.some(sig => 
      bytes.length >= sig.length && 
      sig.every((byte, i) => bytes[i] === byte)
    )
    
    if (!isValid) {
      return { valid: false, error: `File content does not match extension .${ext}` }
    }
  } catch (e) {
    return { valid: false, error: "Failed to read file content" }
  }
  
  return { valid: true }
}