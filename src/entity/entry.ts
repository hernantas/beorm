import { ObjectType, Parser } from 'tipets'
import { ColumnMetadata, TableMetadata } from '../metadata'
import { BiMap } from '../util/map'

export class EntryRegistry {
  private readonly idMap: BiMap<unknown, Entry> = new BiMap()
  private readonly loadQueue: Set<Entry> = new Set()
  private readonly insertQueue: Set<Entry> = new Set()
  private readonly updateQueue: Set<Entry> = new Set()
  private readonly deleteQueue: Set<Entry> = new Set()

  public constructor(
    private readonly parser: Parser,
    private readonly table: TableMetadata,
  ) {}

  public create(): Entry {
    return new Entry(this.parser, this, this.table)
  }

  public clear(): void {
    this.idMap.clear()
    this.loadQueue.clear()
    this.insertQueue.clear()
    this.updateQueue.clear()
    this.deleteQueue.clear()
  }

  public get(): IterableIterator<Entry> {
    return this.idMap.values
  }

  public findById(id: unknown): Entry | undefined {
    return this.idMap.getByKey(id)
  }

  public register(entry: Entry): void {
    const id = entry.id.value
    if (id !== undefined && id !== null) {
      if (this.idMap.hasByKey(id) && this.idMap.getByKey(id) !== entry) {
        throw new Error(`Duplicate value of "${this.table.id.name}" column`)
      }
      this.idMap.setByKey(id, entry)
    }
  }

  public unregister(entry: Entry): void {
    this.idMap.deleteByValue(entry)
  }

  public getLoad(): IterableIterator<Entry> {
    return this.loadQueue.values()
  }

  public hasLoad(entry: Entry): boolean {
    return this.loadQueue.has(entry)
  }

  public registerLoad(entry: Entry): void {
    this.loadQueue.add(entry)
  }

  public unregisterLoad(entry: Entry): void {
    this.loadQueue.delete(entry)
  }

  public getInsert(): IterableIterator<Entry> {
    return this.insertQueue.values()
  }

  public hasInsert(entry: Entry): boolean {
    return this.insertQueue.has(entry)
  }

  public registerInsert(entry: Entry): void {
    this.updateQueue.delete(entry)
    this.insertQueue.add(entry)
  }

  public unregisterInsert(entry: Entry): void {
    this.insertQueue.delete(entry)
  }

  public getUpdate(): IterableIterator<Entry> {
    return this.updateQueue.values()
  }

  public hasUpdate(entry: Entry): boolean {
    return this.updateQueue.has(entry)
  }

  public registerUpdate(entry: Entry): void {
    this.insertQueue.delete(entry)
    this.updateQueue.add(entry)
  }

  public unregisterUpdate(entry: Entry): void {
    this.updateQueue.delete(entry)
  }

  public getDelete(): IterableIterator<Entry> {
    return this.deleteQueue.values()
  }

  public hasDelete(entry: Entry): boolean {
    return this.deleteQueue.has(entry)
  }

  public registerDelete(entry: Entry): void {
    this.deleteQueue.add(entry)
  }

  public unregisterDelete(entry: Entry): void {
    this.deleteQueue.delete(entry)
  }
}

export class Entry {
  private readonly properties: EntryProperty[]
  private _refresh: boolean = false

  public constructor(
    parser: Parser,
    private readonly registry: EntryRegistry,
    public readonly table: TableMetadata,
  ) {
    this.properties = table.columns.map(
      (column) => new EntryProperty(parser, registry, this, column),
    )
  }

  public get load(): boolean {
    return this.registry.hasLoad(this)
  }

  public get preload(): boolean {
    return this.load && !this._refresh
  }

  public set preload(value: boolean) {
    if (value) {
      this.registry.registerLoad(this)
      this._refresh = false
    } else {
      this.registry.unregisterLoad(this)
    }
  }

  public get reload(): boolean {
    return this.load && this._refresh
  }

  public set reload(value: boolean) {
    if (value) {
      this.registry.registerLoad(this)
      this._refresh = true
    } else {
      this.registry.unregisterLoad(this)
    }
  }

  public get delete(): boolean {
    return this.registry.hasDelete(this)
  }

  public set delete(value: boolean) {
    if (value) {
      this.registry.registerDelete(this)
    } else {
      this.registry.unregisterDelete(this)
    }
  }

  public get active(): boolean {
    return this.properties.find((prop) => prop.active) !== undefined
  }

  public get initialized(): boolean {
    return this.properties.find((prop) => prop.initialized) !== undefined
  }

  public initialize(): void {
    this.properties
      .filter((prop) => prop.active)
      .forEach((prop) => prop.initialize())
  }

  public get dirty(): boolean {
    return this.properties.find((prop) => prop.dirty) !== undefined
  }

  public set dirty(value: boolean) {
    this.properties
      .filter((prop) => prop.active)
      .forEach((prop) => (prop.dirty = value))
  }

  public get insert(): boolean {
    return this.registry.hasInsert(this)
  }

  public get update(): boolean {
    return this.registry.hasUpdate(this)
  }

  public property(column: ColumnMetadata): EntryProperty | undefined {
    return this.properties.find((prop) => prop.column === column)
  }

  public get id(): EntryProperty {
    return this.property(this.table.id)!
  }

  public get raw(): ObjectType {
    return this.properties
      .filter((prop) => prop.active)
      .reduce(
        (result, prop) =>
          Object.assign(result, { [prop.column.name]: prop.raw }),
        {},
      )
  }

  public set raw(value: ObjectType) {
    this.properties
      .filter((prop) => Object.hasOwn(value, prop.column.name))
      .forEach((prop) => (prop.raw = value[prop.column.name]))
  }

  public get value(): ObjectType {
    return this.properties
      .filter((prop) => prop.active)
      .reduce(
        (result, prop) =>
          Object.assign(result, { [prop.column.name]: prop.value }),
        {},
      )
  }

  public set value(value: ObjectType) {
    this.properties
      .filter((prop) => Object.hasOwn(value, prop.column.name))
      .forEach((prop) => (prop.value = value[prop.column.name]))
  }
}

export class EntryProperty {
  private data: unknown = undefined
  private _active: boolean = false
  private _initialized: boolean = false
  private _dirty: boolean = false

  public constructor(
    private readonly parser: Parser,
    private readonly registry: EntryRegistry,
    private readonly entry: Entry,
    public readonly column: ColumnMetadata,
  ) {}

  public get active(): boolean {
    return this._active
  }

  public activate(): void {
    this._active = true
  }

  public get initialized(): boolean {
    return this._initialized
  }

  public initialize(): void {
    this.activate()
    this._initialized = true
    this.sync()
  }

  public get dirty(): boolean {
    return this._dirty
  }

  public set dirty(value: boolean) {
    this.activate()
    this._dirty = value
    this.sync()
  }

  private sync(): void {
    if (this.entry.dirty) {
      if (this.entry.initialized) {
        this.registry.registerUpdate(this.entry)
      } else {
        this.registry.registerInsert(this.entry)
      }
    } else {
      this.registry.unregisterInsert(this.entry)
      this.registry.unregisterUpdate(this.entry)
    }
  }

  public get raw(): unknown {
    return this.data
  }

  public set raw(value: unknown) {
    this.dirty = this.dirty || this.data !== value
    this.data = value

    if (this.column.id) {
      this.registry.register(this.entry)
    }
  }

  public get value(): unknown {
    return this.parser.decode(this.raw, this.column.schema)
  }

  public set value(value: unknown) {
    this.activate()
    this.raw = this.parser.encode(value, this.column.schema)
  }
}
