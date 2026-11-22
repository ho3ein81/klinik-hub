import sharp from 'sharp'
import path from 'path'
import { BadRequestError } from './errors'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

export type ImageSizeKey = 't' | 'm'

const SIZE_CONFIG: Record<ImageSizeKey, { width: number; height: number }> = {
  t: { width: 150, height: 150 },
  m: { width: 400, height: 400 },
}

/** The filename a resized variant of `fileName` is stored under, e.g. `photo_t.jpg`. */
export function buildSizedFilename(
  fileName: string,
  size: ImageSizeKey,
): string {
  const ext = path.extname(fileName)
  const prefix = fileName.slice(0, fileName.length - ext.length)
  return `${prefix}_${size}${ext}`
}

/**
 * Generates resized variants of an already-saved file (from multer diskStorage)
 * and writes them alongside the original in the same upload directory.
 */
export async function resizeImage(
  file: Express.Multer.File,
  sizes: ImageSizeKey[] = [],
): Promise<void> {
  const invalid = sizes.filter((s) => !SIZE_CONFIG[s])
  if (invalid.length) {
    throw new BadRequestError(`Invalid size(s): ${invalid.join(', ')}`)
  }

  const originalPath = file.path

  for (const size of sizes) {
    const { width, height } = SIZE_CONFIG[size]
    const filename = buildSizedFilename(file.filename, size)

    await sharp(originalPath)
      .rotate()
      .resize(width, height, { fit: 'cover' })
      .toFile(path.join(UPLOAD_DIR, filename))
  }
}
