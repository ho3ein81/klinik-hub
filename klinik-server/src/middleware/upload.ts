import multer from 'multer'
import path from 'path'
import { Request, Response, NextFunction, RequestHandler } from 'express'
import { BadRequestError } from '../utils/errors'
import { ImageSizeKey, resizeImage } from '../utils/resizeImage'

interface UploadImageOptions {
  fieldName: string
  allowedExtensions: string[] // e.g. ['jpg', 'jpeg', 'png', 'webp']
  maxSizeMB?: number
  /** Resized variants to generate alongside the original, e.g. ['t', 'm']. */
  sizes?: ImageSizeKey[]
}

export function uploadImage(options: UploadImageOptions): RequestHandler {
  const {
    fieldName,
    allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'],
    maxSizeMB = 5,
    sizes = [],
  } = options
  const deleteFieldName = `${fieldName}Delete`
  const normalizedAllowedExt = allowedExtensions.map((e) => e.toLowerCase())

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, 'uploads/')
    },
    filename: (_req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`)
    },
  })

  const fileFilter = (
    _req: any,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    const ext = path.extname(file.originalname).slice(1).toLowerCase()
    if (!ext || !normalizedAllowedExt.includes(ext)) {
      cb(
        new BadRequestError(
          `Only ${allowedExtensions.join(', ')} files are allowed`,
        ),
      )
      return
    }
    cb(null, true)
  }

  const multerMiddleware = multer({
    storage,
    fileFilter,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
  }).single(fieldName)

  return (req: Request, res: Response, next: NextFunction) => {
    multerMiddleware(req, res, (err: unknown) => {
      if (!err) {
        if (req.file && req.file.filename !== '') {
          req.body[fieldName] = req.file.filename

          if (sizes.length > 0) {
            resizeImage(req.file, sizes)
              .then(() => next())
              .catch(next)
            return
          }
        } else {
          const shouldDelete =
            req.body[deleteFieldName] === 'true' ||
            req.body[deleteFieldName] === true

          if (shouldDelete) {
            req.body[fieldName] = null
            delete req.body[deleteFieldName]
          }

          delete req.body[deleteFieldName]
        }

        next()
      } else {
        next(
          err instanceof BadRequestError
            ? err
            : new BadRequestError('File upload failed'),
        )
      }
    })
  }
}
