import { Parser } from 'tipets'
import { ColumnMetadata } from '../metadata'
import { Entry } from './entry'
import { EntryRegistry } from './entry-registry'

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

  public set initialized(value: boolean) {
    this.activate()
    this._initialized = value
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
