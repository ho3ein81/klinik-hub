export class AppError extends Error {
  statusCode: number
  errors?: unknown

  constructor(message: string, statusCode = 500, errors?: unknown) {
    super(message)

    this.statusCode = statusCode
    this.errors = errors

    Object.setPrototypeOf(this, new.target.prototype)
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'errors.badRequest', errors?: unknown) {
    super(message, 400, errors)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'errors.unauthorized') {
    super(message, 401)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'errors.forbidden') {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'errors.notFound') {
    super(message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message = 'errors.conflict') {
    super(message, 409)
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'errors.tooManyRequests') {
    super(message, 429)
  }
}

export class InvalidResourceValueError extends AppError {
  constructor(message = 'errors.invalidResourceValue') {
    super(message, 400)
  }
}

export class OverlappingValueError extends AppError {
  constructor(message = 'errors.overlappingValue') {
    super(message, 409)
  }
}
