import { TypeOf, number, object, string } from 'tipets'
import { EntityRegistry } from './entity'
import { Metadata } from '../metadata'

describe('Entity Registry', () => {
  const schema = object({
    id: number().optional().set('id', true).set('generated', true),
    key: string(),
    value: string().optional(),
  }).set('entity', 'entity_name')
  const table = new Metadata().get(schema)
  const registry = new EntityRegistry(table)
  type Data = TypeOf<typeof schema>

  it('New entity should not be managed', () => {
    const entity: Data = {
      id: 1,
      key: 'key',
      value: 'value',
    }
    expect(registry.has(entity)).toBe(false)
    expect(registry.hasPersist(entity)).toBe(false)
    expect(registry.hasRemove(entity)).toBe(false)
  })

  it('Register new entity to should add to managed', () => {
    const entity: Data = {
      id: 1,
      key: 'key',
      value: 'value',
    }
    registry.register(entity)
    expect(registry.has(entity)).toBe(true)
    expect(registry.hasPersist(entity)).toBe(false)
    expect(registry.hasRemove(entity)).toBe(false)
  })

  it('Register new entity to persist should add to persist queue', () => {
    const entity: Data = {
      id: 1,
      key: 'key',
      value: 'value',
    }
    registry.registerPersist(entity)
    expect(registry.has(entity)).toBe(false)
    expect(registry.hasPersist(entity)).toBe(true)
    expect(registry.hasRemove(entity)).toBe(false)
  })

  it('Register new entity to remove should add to remove queue', () => {
    const entity: Data = {
      id: 1,
      key: 'key',
      value: 'value',
    }
    registry.registerRemove(entity)
    expect(registry.has(entity)).toBe(false)
    expect(registry.hasPersist(entity)).toBe(false)
    expect(registry.hasRemove(entity)).toBe(true)
  })

  it('Register removed entity to persist should add to persist queue only', () => {
    const entity: Data = {
      id: 1,
      key: 'key',
      value: 'value',
    }
    registry.registerRemove(entity)
    registry.registerPersist(entity)
    expect(registry.has(entity)).toBe(false)
    expect(registry.hasPersist(entity)).toBe(true)
    expect(registry.hasRemove(entity)).toBe(false)
  })

  it('Register persist entity to remove should add to remove queue only', () => {
    const entity: Data = {
      id: 1,
      key: 'key',
      value: 'value',
    }
    registry.registerPersist(entity)
    registry.registerRemove(entity)
    expect(registry.has(entity)).toBe(false)
    expect(registry.hasPersist(entity)).toBe(false)
    expect(registry.hasRemove(entity)).toBe(true)
  })
})
