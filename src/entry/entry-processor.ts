import { Knex } from 'knex'
import { TableMetadata } from '../metadata'
import { ObjectType, Parser } from 'tipets'
import { EntryRegistry } from './entry-registry'

export class EntryProcessor {
  public constructor(
    private readonly parser: Parser,
    private readonly transaction: Knex.Transaction,
    private readonly table: TableMetadata,
    private readonly registry: EntryRegistry,
  ) {}

  public async run(): Promise<void> {
    await this.doDelete()

    this.prepare()
    await this.doLoad()
    await this.doInsert()
    await this.doUpdate()
  }

  public async doDelete(): Promise<void> {
    const deleteEntries = Array.from(this.registry.getDelete())
      .filter((entry) => entry.id.active)
      .filter((entry) => entry.id.raw !== undefined)
      .filter((entry) => entry.id.raw !== null)

    if (deleteEntries.length > 0) {
      const ids = deleteEntries
        .map((entry) => entry.id.raw)
        .map((id) => String(id))

      await this.transaction
        .from(this.table.name)
        .delete()
        .whereIn(this.table.id.name, ids)
        .returning(this.table.baseColumns.map((col) => col.name))

      deleteEntries.forEach((entry) => {
        entry.delete = false
        entry.initialized = false
        entry.preload = false
        entry.reload = false
        entry.dirty = false
      })
    }

    this.registry.clearDelete()
  }

  private prepare(): void {
    // if id is generated, try to fetch from db if it has id
    if (this.table.id.generated) {
      Array.from(this.registry.getInsert())
        .filter((entry) => entry.id.raw !== undefined)
        .filter((entry) => entry.id.raw !== null)
        .filter((entry) => !entry.load)
        .forEach((entry) => (entry.preload = true))
    }
  }

  public async doLoad(): Promise<void> {
    const ids = Array.from(this.registry.getLoad())
      .map((entry) => entry.id.raw)
      .map((id) => String(id))

    const rows: ObjectType[] = await this.transaction
      .from(this.table.name)
      .select(this.table.baseColumns.map((col) => col.name))
      .whereIn(this.table.id.name, ids)

    rows.forEach((row) => {
      const id = this.parser.decode(
        row[this.table.id.name],
        this.table.id.schema,
      )
      if (id === undefined || id === null) {
        throw new Error('Result from db do not have a primary key')
      }

      const entry = this.registry.findById(id) ?? this.registry.create()
      const raw = entry.raw
      entry.applyRaw(row, (prop) => {
        prop.initialized = true
        prop.dirty = false
      })
      if (entry.preload) {
        entry.raw = raw
      }
      entry.preload = false
      entry.reload = false
    })
    this.registry.clearLoad()
  }

  public async doInsert(): Promise<void> {
    for (const entry of this.registry.getInsert()) {
      const rows: ObjectType[] = await this.transaction
        .from(this.table.name)
        .insert(entry.dirtyRaw)
        .returning(this.table.baseColumns.map((col) => col.name))
      const row = rows[0]
      if (row === undefined) {
        throw new Error('Cannot get insert result from db')
      }

      entry.applyRaw(row, (prop) => {
        prop.initialized = true
        prop.dirty = false
      })
      entry.preload = false
      entry.reload = false
    }
    this.registry.clearInsert()
  }

  public async doUpdate(): Promise<void> {
    for (const entry of this.registry.getUpdate()) {
      const rows: ObjectType[] = await this.transaction
        .from(this.table.name)
        .update(entry.dirtyRaw)
        .where(this.table.id.name, String(entry.id.raw))
        .returning(this.table.baseColumns.map((col) => col.name))
      const row = rows[0]
      if (row === undefined) {
        throw new Error('Cannot get update result from db')
      }

      entry.applyRaw(row, (prop) => {
        prop.initialized = true
        prop.dirty = false
      })
      entry.preload = false
      entry.reload = false
    }
    this.registry.clearUpdate()
  }
}
