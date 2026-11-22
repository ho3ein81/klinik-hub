export function buildSearchWhere<T extends object>(
  search: string | undefined,
  fields: string[],
): T {
  if (!search) return {} as T

  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: search,
        mode: 'insensitive',
      },
    })),
  } as T
}
