// Client-side mirrors of klinik-server's zod validation rules (see
// klinik-server/src/utils/validation.ts and each module's *.validation.ts).

export type Validator = (value: string) => string | undefined

export const required =
  (message = 'This field is required'): Validator =>
  (value) =>
    value.trim() === '' ? message : undefined

export const minLength =
  (min: number, message?: string): Validator =>
  (value) =>
    value !== '' && value.trim().length < min
      ? (message ?? `Must be at least ${min} characters`)
      : undefined

export const maxLength =
  (max: number, message?: string): Validator =>
  (value) =>
    value.length > max ? (message ?? `Must be at most ${max} characters`) : undefined

// Matches klinik-server's phoneSchema: /^\d{7,15}$/
export const isPhone =
  (message = 'Phone number must contain 7-15 digits'): Validator =>
  (value) =>
    value !== '' && !/^\d{7,15}$/.test(value) ? message : undefined

// Matches klinik-server's timeSchema: /^([01]\d|2[0-3]):[0-5]\d$/
export const isTime =
  (message = 'Time must be in HH:mm format'): Validator =>
  (value) =>
    value !== '' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? message : undefined

// Matches loginPatientSchema/bookAppointmentAnonymousSchema: z.string().length(6)
export const isOtpCode =
  (message = 'Enter the 6-digit code'): Validator =>
  (value) =>
    value !== '' && !/^\d{6}$/.test(value) ? message : undefined

export function validate<T extends object>(
  values: T,
  schema: Partial<Record<keyof T, Validator[]>>,
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {}
  const record = values as Record<string, unknown>
  for (const key in schema) {
    const validators = schema[key]
    if (!validators) continue
    const value = record[key as string]
    for (const validator of validators) {
      const error = validator(typeof value === 'string' ? value : '')
      if (error) {
        errors[key] = error
        break
      }
    }
  }
  return errors
}

export function hasErrors<T>(errors: Partial<Record<keyof T, string>>): boolean {
  return Object.keys(errors).length > 0
}
