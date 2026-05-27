const MAX_FILE_SIZE_MB = 10
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const THUMBNAIL_SIZE = 400
const MAX_DIMENSION = 1920

export async function compressImage(
  file: File,
  quality: number = 0.8,
  maxWidth: number = MAX_DIMENSION,
  maxHeight: number = MAX_DIMENSION
): Promise<File> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
  const newExt = ext === "png" ? "png" : "webp"

  try {
    const bitmap = await createImageBitmap(file)
    const { width, height } = bitmap
    
    let targetWidth = width
    let targetHeight = height

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height)
      targetWidth = Math.round(width * ratio)
      targetHeight = Math.round(height * ratio)
    }

    const canvas = document.createElement("canvas")
    canvas.width = targetWidth
    canvas.height = targetHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Failed to get canvas context")
    }

    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)

    const blob: Blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (!b) reject(new Error("Failed to compress image"));
          else resolve(b);
        },
        newExt === "png" ? "image/png" : "image/webp",
        quality,
      );
    });

    const newName = file.name.replace(/\.[^/.]+$/, `.${newExt}`)

    return new File([blob], newName, {
      type: newExt === "png" ? "image/png" : "image/webp",
      lastModified: file.lastModified,
    })
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to compress image")
  }
}

export async function generateThumbnail(
  file: File,
  size: number = THUMBNAIL_SIZE
): Promise<File> {
  return compressImage(file, 0.7, size, size)
}