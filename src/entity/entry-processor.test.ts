import 'dotenv/config'
import { ObjectType, Parser, number, object, string } from 'tipets'
import { DataSource } from '../data-source'
import { TableMetadata, getMetadata } from '../metadata'
import { getEnvironment } from '../util/environment'
import { EntryRegistry } from './entry'
import { EntryProcessor } from './entry-processor'

describe('Entry Processor', () => {
  const { CLIENT, HOST, PORT, USER, PASSWORD, DATABASE } = getEnvironment()
  const source = new DataSource({
    client: CLIENT,
    host: HOST,
    port: PORT,
    user: USER,
    password: PASSWORD,
    database: DATABASE,
  })
  const parser = Parser.create()
  const baseSchema = object({
    id: number().optional().set('id', true).set('generated', true),
    key: string(),
    value: string().optional(),
  })

  const truncate = async (table: TableMetadata) =>
    source.query().table(table.name).truncate()

  const flush = async (table: TableMetadata, registry: EntryRegistry) =>
    source.transaction((trx) =>
      new EntryProcessor(parser, trx, table, registry).run(),
    )

  const createRaw = (
    table: TableMetadata,
    index: number,
    id?: unknown,
  ): ObjectType =>
    id !== undefined
      ? {
          id,
          key: `${table.name}-key-${index}`,
          value: `${table.name}-value-${index}`,
        }
      : {
          key: `${table.name}-key-${index}`,
          value: `${table.name}-value-${index}`,
        }

  const insertOne = async (
    table: TableMetadata,
    raw: ObjectType,
  ): Promise<ObjectType> => {
    const rows: ObjectType[] = await source
      .query()
      .from(table.name)
      .insert(raw)
      .returning(table.columns.map((c) => c.name))
    return rows[0]!
  }

  const expectDbEqual = async (
    table: TableMetadata,
    raw: ObjectType,
  ): Promise<void> => {
    const rows: ObjectType[] = await source
      .query()
      .from(table.name)
      .select(table.columns.map((c) => c.name))
      .where(table.id.name, String(raw[table.id.name]))
    const row = rows[0]!
    expect(raw).toStrictEqual(row)
  }

  it('Entry preload should be preloaded', async () => {
    const schema = baseSchema.set('entity', 'entry_preload')
    const table = getMetadata(schema)
    await truncate(table)

    const row = await insertOne(table, createRaw(table, 1))
    const id = row[table.id.name]

    const registry = new EntryRegistry(parser, table)
    const entry = registry.create()
    entry.id.raw = id
    entry.preload = true
    await flush(table, registry)

    expect(entry.raw).toStrictEqual(createRaw(table, 1, id))
    expect(entry.initialized).toBe(true)
    expect(entry.preload).toBe(false)
    expect(entry.reload).toBe(false)
    expect(entry.dirty).toBe(false)
    await expectDbEqual(table, entry.raw)
  })

  it('Entry reload should be reloaded', async () => {
    const schema = baseSchema.set('entity', 'entry_reload')
    const table = getMetadata(schema)
    await truncate(table)

    const row = await insertOne(table, createRaw(table, 1))
    const id = row[table.id.name]

    const registry = new EntryRegistry(parser, table)
    const entry = registry.create()
    entry.raw = createRaw(table, 2, id)
    entry.reload = true
    await flush(table, registry)

    expect(entry.raw).toStrictEqual(createRaw(table, 1, id))
    expect(entry.initialized).toBe(true)
    expect(entry.preload).toBe(false)
    expect(entry.reload).toBe(false)
    expect(entry.dirty).toBe(false)
    await expectDbEqual(table, entry.raw)
  })

  it('Entry should insert when its new and dirty', async () => {
    const schema = baseSchema.set('entity', 'entry_insert')
    const table = getMetadata(schema)
    await truncate(table)

    const registry = new EntryRegistry(parser, table)
    const entry = registry.create()
    entry.raw = createRaw(table, 1)
    await flush(table, registry)

    expect(entry.id.active).toBe(true)
    expect(entry.id.initialized).toBe(true)
    expect(entry.id.raw).not.toBe(undefined)
    expect(entry.id.dirty).toBe(false)
    expect(entry.initialized).toBe(true)
    await expectDbEqual(table, entry.raw)
  })

  it('Modified initialized entry should update when dirty', async () => {
    const schema = baseSchema.set('entity', 'entry_update')
    const table = getMetadata(schema)
    await truncate(table)

    const registry = new EntryRegistry(parser, table)
    const entry = registry.create()
    entry.raw = createRaw(table, 1)
    await flush(table, registry)

    entry.raw = createRaw(table, 2)
    await flush(table, registry)

    expect(entry.initialized).toBe(true)
    expect(entry.dirty).toBe(false)
    expect(entry.insert).toBe(false)
    expect(entry.update).toBe(false)
    expect(entry.preload).toBe(false)
    expect(entry.reload).toBe(false)
    expect(entry.load).toBe(false)
    await expectDbEqual(table, entry.raw)
  })

  it('Deleted entry should also delete the database row', async () => {
    const schema = baseSchema.set('entity', 'entry_delete')
    const table = getMetadata(schema)
    await truncate(table)

    const registry = new EntryRegistry(parser, table)
    const entry = registry.create()
    entry.raw = createRaw(table, 1)
    await flush(table, registry)

    entry.delete = true
    await flush(table, registry)

    const rows: ObjectType[] = await source
      .query()
      .from(table.name)
      .select(table.columns.map((c) => c.name))
    expect(rows.length).toBe(0)
  })

  afterAll(async () => {
    await source.close()
  })
})
