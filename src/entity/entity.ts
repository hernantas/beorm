import { ObjectType } from 'tipets'
import { TableMetadata } from '../metadata'
import { BiMap } from '../util/map'

export class EntityRegistry {
  private readonly idMap: BiMap<unknown, ObjectType> = new BiMap()
  private readonly persistQueue: Set<ObjectType> = new Set()
  private readonly removeQueue: Set<ObjectType> = new Set()

  public constructor(private readonly table: TableMetadata) {}

  public get(): IterableIterator<ObjectType> {
    return this.idMap.values
  }

  public has(entity: ObjectType): boolean {
    return this.idMap.hasByValue(entity)
  }

  public findById(id: unknown): ObjectType | undefined {
    return this.idMap.getByKey(id)
  }

  public register(entity: ObjectType): void {
    const id = entity[this.table.id.name]
    if (id !== undefined && id !== null) {
      if (this.idMap.hasByKey(id) && this.idMap.getByKey(id) !== entity) {
        throw new Error(`Duplicate value of "${this.table.id.name}" column`)
      }
      this.idMap.setByKey(id, entity)
    }
  }

  public unregister(entity: ObjectType): void {
    this.idMap.deleteByValue(entity)
  }

  public clear(): void {
    this.idMap.clear()
  }

  public getPersist(): IterableIterator<ObjectType> {
    return this.persistQueue.values()
  }

  public hasPersist(entity: ObjectType): boolean {
    return this.persistQueue.has(entity)
  }

  public registerPersist(entity: ObjectType): void {
    this.persistQueue.add(entity)
    this.removeQueue.delete(entity)
  }

  public unregisterPersist(entity: ObjectType): void {
    this.persistQueue.delete(entity)
  }

  public clearPersist(): void {
    this.persistQueue.clear()
  }

  public getRemove(): IterableIterator<ObjectType> {
    return this.removeQueue.values()
  }

  public hasRemove(entity: ObjectType): boolean {
    return this.removeQueue.has(entity)
  }

  public registerRemove(entity: ObjectType): void {
    this.persistQueue.delete(entity)
    this.removeQueue.add(entity)
  }

  public unregisterRemove(entity: ObjectType): void {
    this.removeQueue.delete(entity)
  }

  public clearRemove(): void {
    this.removeQueue.clear()
  }
}
