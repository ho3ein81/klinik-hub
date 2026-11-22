import { BadRequestError } from './errors'

export function getParam(value: string | string[]): string {
  if (typeof value !== 'string') {
    throw new BadRequestError('Invalid route parameter')
  }

  return value
}
