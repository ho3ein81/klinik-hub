import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { BadRequestError } from '../utils/errors'

export function validate<T extends z.ZodType>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    })

    if (!result.success) {
      next(
        new BadRequestError('Validation failed', z.treeifyError(result.error)),
      )
      return
    }

    const data = result.data as any
    if (data.body) req.body = data.body
    if (data.params) req.params = data.params
    if (data.query) req.validatedQuery = data.query

    next()
  }
}
