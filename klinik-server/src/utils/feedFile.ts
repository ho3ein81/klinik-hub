import fs from 'fs'
import mime from 'mime-types'
import { Response } from 'express'
import { checkExistFile } from './checkExistFile'
import { NotFoundError } from './errors'
import { buildSizedFilename, ImageSizeKey } from './resizeImage'

export async function feedFile(
  filePath: string,
  fileName: string,
  res: Response,
  size?: ImageSizeKey,
): Promise<void> {
  const sizedFileName = size ? buildSizedFilename(fileName, size) : fileName
  const sizedFullPath = `${filePath}${sizedFileName}`

  const fullPath = (await checkExistFile(sizedFullPath))
    ? sizedFullPath
    : `${filePath}${fileName}`

  const exists = await checkExistFile(fullPath)
  if (!exists) {
    throw new NotFoundError('File not found')
  }

  let contentType: string
  contentType = mime.lookup(fullPath) || 'application/octet-stream'

  const readableStream = fs.createReadStream(fullPath)

  return new Promise((resolve, reject) => {
    readableStream.on('open', () => {
      res.setHeader('Content-Type', contentType)
      readableStream.pipe(res)
    })

    readableStream.on('close', () => {
      resolve()
    })

    readableStream.on('error', (err) => {
      reject(err)
    })
  })
}
