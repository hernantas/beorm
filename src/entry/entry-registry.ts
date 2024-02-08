import { Parser } from 'tipets'
import { TableMetadata } from '../metadata'
import { BiMap } from '../util/map'
import { Entry } from './entry'

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
    this.clearLoad()
    this.clearInsert()
    this.clearUpdate()
    this.clearDelete()
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

  public clearLoad(): void {
    this.loadQueue.clear()
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

  public clearInsert(): void {
    this.insertQueue.clear()
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

  public clearUpdate(): void {
    this.updateQueue.clear()
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

  public clearDelete(): void {
    this.deleteQueue.clear()
  }
}
