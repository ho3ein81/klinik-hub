import { PrismaClient, Prisma } from '@prisma/client'

/** An open Prisma transaction, as handed to the callback of `prisma.$transaction(async (tx) => ...)`. */
export type TransactionClient = Prisma.TransactionClient

/** Either the global Prisma client or an in-flight transaction — every
 * repository method takes one of these so several repositories can be
 * composed into a single unit of work. Defaults to the global client. */
export type DbClient = PrismaClient | TransactionClient

// minimal shape every Prisma model delegate satisfies
interface ModelDelegate<
  TModel,
  TWhereInput,
  TWhereUniqueInput,
  TOrderByInput,
  TCreateInput,
  TUpdateInput,
> {
  findMany(args?: {
    where?: TWhereInput
    orderBy?: TOrderByInput
    skip?: number
    take?: number
    include?: Record<string, unknown>
  }): any
  count(args?: { where?: TWhereInput }): any
  findUnique(args: {
    where: TWhereUniqueInput
    include?: Record<string, unknown>
  }): any
  findFirst(args?: {
    where?: TWhereInput
    orderBy?: TOrderByInput
    include?: Record<string, unknown>
  }): any
  create(args: { data: TCreateInput }): any
  update(args: { where: TWhereUniqueInput; data: TUpdateInput }): any
  updateMany(args: { where: TWhereInput; data: TUpdateInput }): any
  delete(args: { where: TWhereUniqueInput }): any
  deleteMany(args: { where: TWhereInput }): any
  createMany(args: { data: TCreateInput[] }): any
}

export interface FindAllOptions<TWhereInput, TOrderByInput> {
  where?: TWhereInput
  orderBy?: TOrderByInput
  skip?: number
  take?: number
  /** Eager-load relations, e.g. `{ patient: true, doctor: true }`. Pass a
   * `TResult` type argument on the call (e.g. `findAll<FullAppointment>(...)`)
   * to get the included relations back in the result's type. */
  include?: Record<string, unknown>
}

export interface FindOneOptions<TWhereInput, TOrderByInput> {
  orderBy?: TOrderByInput
  include?: Record<string, unknown>
}

export interface FindAllResult<TModel> {
  data: TModel[]
  total: number
}

export abstract class BaseRepository<
  TModel,
  TWhereInput,
  TWhereUniqueInput,
  TOrderByInput,
  TCreateInput,
  TUpdateInput,
> {
  /**
   * @param modelKey the property name of this model on `PrismaClient`
   *   (e.g. `'appointment'`) — resolved against whichever client a call
   *   is given, so the same repository works against the global client
   *   or a transaction.
   */
  constructor(
    protected readonly prisma: PrismaClient,
    private readonly modelKey: string,
  ) {}

  private delegateFor(
    client: DbClient,
  ): ModelDelegate<
    TModel,
    TWhereInput,
    TWhereUniqueInput,
    TOrderByInput,
    TCreateInput,
    TUpdateInput
  > {
    return (client as unknown as Record<string, unknown>)[
      this.modelKey
    ] as ModelDelegate<
      TModel,
      TWhereInput,
      TWhereUniqueInput,
      TOrderByInput,
      TCreateInput,
      TUpdateInput
    >
  }

  async findAll<TResult = TModel>(
    options: FindAllOptions<TWhereInput, TOrderByInput> = {},
    client: DbClient = this.prisma,
  ): Promise<FindAllResult<TResult>> {
    const { where, orderBy, skip, take, include } = options
    const delegate = this.delegateFor(client)

    // A transaction client can't open a nested $transaction — if we're
    // already inside one (unit of work), just run both queries against it.
    if (client !== this.prisma) {
      const [data, total] = await Promise.all([
        delegate.findMany({ where, orderBy, skip, take, include }),
        delegate.count({ where }),
      ])
      return { data: data as TResult[], total }
    }

    const [data, total] = await this.prisma.$transaction([
      delegate.findMany({ where, orderBy, skip, take, include }),
      delegate.count({ where }),
    ])
    return { data: data as TResult[], total }
  }

  async findOne<TResult = TModel>(
    where: TWhereUniqueInput,
    options: FindOneOptions<TWhereInput, TOrderByInput> = {},
    client: DbClient = this.prisma,
  ): Promise<TResult | null> {
    return this.delegateFor(client).findUnique({
      where,
      include: options.include,
    }) as Promise<TResult | null>
  }

  async findFirst<TResult = TModel>(
    where: TWhereInput,
    options: FindOneOptions<TWhereInput, TOrderByInput> = {},
    client: DbClient = this.prisma,
  ): Promise<TResult | null> {
    return this.delegateFor(client).findFirst({
      where,
      include: options.include,
    }) as Promise<TResult | null>
  }

  async findById<TResult = TModel>(
    id: string,
    options: FindOneOptions<TWhereInput, TOrderByInput> = {},
    client: DbClient = this.prisma,
  ): Promise<TResult | null> {
    return this.findOne<TResult>({ id } as TWhereUniqueInput, options, client)
  }

  async create(
    data: TCreateInput,
    client: DbClient = this.prisma,
  ): Promise<TModel> {
    return this.delegateFor(client).create({ data })
  }

  async createMany(
    data: TCreateInput[],
    client: DbClient = this.prisma,
  ): Promise<TModel> {
    return this.delegateFor(client).createMany({ data })
  }

  async updateOne(
    where: TWhereUniqueInput,
    data: TUpdateInput,
    client: DbClient = this.prisma,
  ): Promise<TModel> {
    return this.delegateFor(client).update({ where, data })
  }

  async updateById(
    id: string,
    data: TUpdateInput,
    client: DbClient = this.prisma,
  ): Promise<TModel> {
    return this.updateOne({ id } as TWhereUniqueInput, data, client)
  }

  async update(
    where: TWhereInput,
    data: TUpdateInput,
    client: DbClient = this.prisma,
  ): Promise<{ count: number }> {
    return this.delegateFor(client).updateMany({ where, data })
  }

  async deleteOne(
    where: TWhereUniqueInput,
    client: DbClient = this.prisma,
  ): Promise<TModel> {
    return this.delegateFor(client).delete({ where })
  }

  async deleteById(
    id: string,
    client: DbClient = this.prisma,
  ): Promise<TModel> {
    return this.deleteOne({ id } as TWhereUniqueInput, client)
  }

  async delete(
    where: TWhereInput,
    client: DbClient = this.prisma,
  ): Promise<{ count: number }> {
    return this.delegateFor(client).deleteMany({ where })
  }
}
