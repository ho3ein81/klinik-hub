export function withScope<T extends Record<string, any>>(
  where: T,
  value?: string,
  field: string = 'clinicId',
): T {
  return {
    ...where,
    ...(value && { [field]: value }),
  }
}
