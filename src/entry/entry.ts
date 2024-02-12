import { ObjectType, Parser } from 'tipets'
import { ColumnMetadata, TableMetadata } from '../metadata'
import { EntryProperty } from './entry-property'
import { EntryRegistry } from './entry-registry'

export class Entry {
  private readonly properties: EntryProperty[]
  private _refresh: boolean = false

  public constructor(
    private readonly parser: Parser,
    private readonly registry: EntryRegistry,
    public readonly table: TableMetadata,
  ) {
    this.properties = table.baseColumns.map(
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

  public set initialized(value: boolean) {
    this.properties
      .filter((prop) => prop.active)
      .forEach((prop) => (prop.initialized = value))
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

  public get dirtyRaw(): ObjectType {
    return this.properties
      .filter((prop) => prop.active)
      .filter((prop) => prop.dirty)
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

  public applyRaw(value: ObjectType, fn: (prop: EntryProperty) => void): void {
    this.properties
      .filter((prop) => Object.hasOwn(value, prop.column.name))
      .forEach((prop) => {
        prop.raw = value[prop.column.name]
        fn(prop)
      })
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

  public newEntity(): ObjectType {
    return this.parser.decode(this.raw, this.table.schema)
  }

  public hydrate(entity: ObjectType): void {
    this.properties
      .filter((prop) => prop.active)
      .forEach((prop) => (entity[prop.column.name] = prop.value))
  }
}
