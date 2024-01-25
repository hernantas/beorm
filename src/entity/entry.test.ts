import { Parser, number, object, string } from 'tipets'
import { ColumnMetadata, MetadataRegistry } from '../metadata'
import { Entry, EntryRegistry } from './entry'

describe('Entry', () => {
  const schema = object({
    id: number().optional().set('id', true).set('generated', true),
    key: string(),
    value: string().optional(),
  }).set('entity', 'entry')
  const parser = Parser.create()
  const metadata = new MetadataRegistry()
  const table = metadata.get(schema)
  const registry = new EntryRegistry(parser, table)

  const raw = {
    key: 'key',
    value: 'value',
  }

  const testActive = (entry: Entry, value: boolean) =>
    it(`Entry "active" state should be "${value}"`, () =>
      expect(entry.active).toBe(value))
  const testDelete = (entry: Entry, value: boolean) =>
    it(`Entry "delete" state should be "${value}"`, () =>
      expect(entry.delete).toBe(value))
  const testDirty = (entry: Entry, value: boolean) =>
    it(`Entry "dirty" state should be "${value}"`, () =>
      expect(entry.dirty).toBe(value))
  const testInitialized = (entry: Entry, value: boolean) =>
    it(`Entry "initialized" state should be "${value}"`, () =>
      expect(entry.initialized).toBe(value))
  const testInsert = (entry: Entry, value: boolean) =>
    it(`Entry "insert" state should be "${value}"`, () =>
      expect(entry.insert).toBe(value))
  const testLoad = (entry: Entry, value: boolean) =>
    it(`Entry "load" state should be "${value}"`, () =>
      expect(entry.load).toBe(value))
  const testPreload = (entry: Entry, value: boolean) =>
    it(`Entry "preload" state should be "${value}"`, () =>
      expect(entry.preload).toBe(value))
  const testReload = (entry: Entry, value: boolean) =>
    it(`Entry "reload" state should be "${value}"`, () =>
      expect(entry.reload).toBe(value))
  const testUpdate = (entry: Entry, value: boolean) =>
    it(`Entry "update" state should be "${value}"`, () =>
      expect(entry.update).toBe(value))
  const testRaw = (entry: Entry, value: unknown) =>
    it(`Entry "raw" state should be "${JSON.stringify(value)}"`, () =>
      expect(entry.raw).toStrictEqual(value))
  const testValue = (entry: Entry, value: unknown) =>
    it(`Entry "raw" state should be "${JSON.stringify(value)}"`, () =>
      expect(entry.value).toStrictEqual(value))

  describe('State: New', () => {
    const entry = registry.create()
    testActive(entry, false)
    testInitialized(entry, false)
    testLoad(entry, false)
    testPreload(entry, false)
    testReload(entry, false)
    testDelete(entry, false)
    testDirty(entry, false)
    testInsert(entry, false)
    testUpdate(entry, false)
    testRaw(entry, {})
    testValue(entry, {})
  })

  describe('State: New => Preload', () => {
    const entry = registry.create()
    entry.preload = true
    testActive(entry, false)
    testInitialized(entry, false)
    testLoad(entry, true)
    testPreload(entry, true)
    testReload(entry, false)
    testDelete(entry, false)
    testDirty(entry, false)
    testInsert(entry, false)
    testUpdate(entry, false)
    testRaw(entry, {})
    testValue(entry, {})
  })

  describe('State: New => Reload => Preload', () => {
    const entry = registry.create()
    entry.reload = true
    entry.preload = true
    testActive(entry, false)
    testInitialized(entry, false)
    testLoad(entry, true)
    testPreload(entry, true)
    testReload(entry, false)
    testDelete(entry, false)
    testDirty(entry, false)
    testInsert(entry, false)
    testUpdate(entry, false)
    testRaw(entry, {})
    testValue(entry, {})
  })

  describe('State: New => Reload', () => {
    const entry = registry.create()
    entry.reload = true
    testActive(entry, false)
    testInitialized(entry, false)
    testLoad(entry, true)
    testPreload(entry, false)
    testReload(entry, true)
    testDelete(entry, false)
    testDirty(entry, false)
    testInsert(entry, false)
    testUpdate(entry, false)
    testRaw(entry, {})
    testValue(entry, {})
  })

  describe('State: New => Preload => Reload', () => {
    const entry = registry.create()
    entry.preload = true
    entry.reload = true
    testActive(entry, false)
    testInitialized(entry, false)
    testLoad(entry, true)
    testPreload(entry, false)
    testReload(entry, true)
    testDelete(entry, false)
    testDirty(entry, false)
    testInsert(entry, false)
    testUpdate(entry, false)
    testRaw(entry, {})
    testValue(entry, {})
  })

  describe('State: New => Delete', () => {
    const entry = registry.create()
    entry.delete = true
    testActive(entry, false)
    testInitialized(entry, false)
    testLoad(entry, false)
    testPreload(entry, false)
    testReload(entry, false)
    testDelete(entry, true)
    testDirty(entry, false)
    testInsert(entry, false)
    testUpdate(entry, false)
    testRaw(entry, {})
    testValue(entry, {})
  })

  describe('State: New => Initialize', () => {
    const entry = registry.create()
    entry.initialize()
    testActive(entry, false)
    testInitialized(entry, false)
    testLoad(entry, false)
    testPreload(entry, false)
    testReload(entry, false)
    testDelete(entry, false)
    testDirty(entry, false)
    testInsert(entry, false)
    testUpdate(entry, false)
    testRaw(entry, {})
    testValue(entry, {})
  })

  describe('State: New => Dirty(true)', () => {
    const entry = registry.create()
    entry.dirty = true
    testActive(entry, false)
    testInitialized(entry, false)
    testLoad(entry, false)
    testPreload(entry, false)
    testReload(entry, false)
    testDelete(entry, false)
    testDirty(entry, false)
    testInsert(entry, false)
    testUpdate(entry, false)
    testRaw(entry, {})
    testValue(entry, {})
  })

  describe('State: New => Modify', () => {
    const entry = registry.create()
    entry.raw = raw
    testActive(entry, true)
    testInitialized(entry, false)
    testLoad(entry, false)
    testPreload(entry, false)
    testReload(entry, false)
    testDelete(entry, false)
    testDirty(entry, true)
    testInsert(entry, true)
    testUpdate(entry, false)
    testRaw(entry, raw)
    testValue(entry, raw)
  })

  describe('State: New => Modify => Dirty(false)', () => {
    const entry = registry.create()
    entry.raw = raw
    entry.dirty = false
    testActive(entry, true)
    testInitialized(entry, false)
    testLoad(entry, false)
    testPreload(entry, false)
    testReload(entry, false)
    testDelete(entry, false)
    testDirty(entry, false)
    testInsert(entry, false)
    testUpdate(entry, false)
    testRaw(entry, raw)
    testValue(entry, raw)
  })

  describe('State: New => Modify => Dirty(false) => Dirty(true)', () => {
    const entry = registry.create()
    entry.raw = raw
    entry.dirty = false
    entry.dirty = true
    testActive(entry, true)
    testInitialized(entry, false)
    testLoad(entry, false)
    testPreload(entry, false)
    testReload(entry, false)
    testDelete(entry, false)
    testDirty(entry, true)
    testInsert(entry, true)
    testUpdate(entry, false)
    testRaw(entry, raw)
    testValue(entry, raw)
  })

  describe('State: New => Modify => Initialize', () => {
    const entry = registry.create()
    entry.raw = raw
    entry.initialize()
    testActive(entry, true)
    testInitialized(entry, true)
    testLoad(entry, false)
    testPreload(entry, false)
    testReload(entry, false)
    testDelete(entry, false)
    testDirty(entry, true)
    testInsert(entry, false)
    testUpdate(entry, true)
    testRaw(entry, raw)
    testValue(entry, raw)
  })

  describe('State: New => Modify => Initialize => Modify', () => {
    const newRaw = {
      key: 'new-key',
      value: 'new-value',
    }

    const entry = registry.create()
    entry.raw = {
      key: 'key',
      value: 'value',
    }
    entry.initialize()
    entry.raw = newRaw
    testActive(entry, true)
    testInitialized(entry, true)
    testLoad(entry, false)
    testPreload(entry, false)
    testReload(entry, false)
    testDelete(entry, false)
    testDirty(entry, true)
    testInsert(entry, false)
    testUpdate(entry, true)
    testRaw(entry, newRaw)
    testValue(entry, newRaw)
  })

  it('Same "id" in the same storage should throw', () => {
    const mRaw = {
      ...raw,
      id: 1,
    }

    const entry1 = registry.create()
    entry1.raw = mRaw

    const entry2 = registry.create()
    expect(() => (entry2.raw = mRaw)).toThrow()
  })

  it('Entry should create entity based on its current value', () => {
    const mRaw = {
      ...raw,
      id: 2,
    }
    const entry = registry.create()
    entry.raw = mRaw
    expect(entry.newEntity()).toStrictEqual(mRaw)
  })

  describe('Entry Property', () => {
    const schema = object({
      id: number().set('id', true),
      singleValue: string(),
      singleValueGenerated: string().set('generated', true),
      collectionValue: number().array(),
      collectionValueGenerated: number().array().set('generated', true),
    }).set('entity', 'entry_property')
    const table = metadata.get(schema)
    const registry = new EntryRegistry(parser, table)

    const testPropertyActive = (
      column: ColumnMetadata,
      entry: Entry,
      value: boolean,
    ) =>
      it(`"${column.name}" Entry Property "active" state should be "${value}"`, () =>
        expect(entry.property(column)!.active).toBe(value))
    const testPropertyInitialized = (
      column: ColumnMetadata,
      entry: Entry,
      value: boolean,
    ) =>
      it(`"${column.name}" Entry Property "initialized" state should be "${value}"`, () =>
        expect(entry.property(column)!.initialized).toBe(value))
    const testPropertyDirty = (
      column: ColumnMetadata,
      entry: Entry,
      value: boolean,
    ) =>
      it(`"${column.name}" Entry Property "dirty" state should be "${value}"`, () =>
        expect(entry.property(column)!.dirty).toBe(value))
    const testPropertyRaw = (
      column: ColumnMetadata,
      entry: Entry,
      value: unknown,
    ) =>
      it(`"${column.name}" Entry Property raw value should be "${value}"`, () =>
        expect(entry.property(column)!.raw).toStrictEqual(value))
    const testPropertyValue = (
      column: ColumnMetadata,
      entry: Entry,
      value: unknown,
    ) =>
      it(`"${column.name}" Entry Property value should be "${value}"`, () =>
        expect(entry.property(column)!.value).toStrictEqual(value))

    const id = table.column('id')!
    const singleValue = table.column('singleValue')!
    const singleValueGenerated = table.column('singleValueGenerated')!
    const collectionValue = table.column('collectionValue')!
    const collectionValueGenerated = table.column('collectionValueGenerated')!

    const raw = {
      id: 1,
      singleValue: 'single_value',
      singleValueGenerated: 'single_value_generated',
      collectionValue: [0, 1, 2, 3, 4],
      collectionValueGenerated: [0, 1, 2, 3, 4],
    }

    describe('State: New', () => {
      const entry = registry.create()

      testPropertyActive(id, entry, false)
      testPropertyInitialized(id, entry, false)
      testPropertyDirty(id, entry, false)
      testPropertyRaw(id, entry, undefined)
      testPropertyValue(id, entry, 0)

      testPropertyActive(singleValue, entry, false)
      testPropertyInitialized(singleValue, entry, false)
      testPropertyDirty(singleValue, entry, false)
      testPropertyRaw(singleValue, entry, undefined)
      testPropertyValue(singleValue, entry, '')

      testPropertyActive(singleValueGenerated, entry, false)
      testPropertyInitialized(singleValueGenerated, entry, false)
      testPropertyDirty(singleValueGenerated, entry, false)
      testPropertyRaw(singleValueGenerated, entry, undefined)
      testPropertyValue(singleValueGenerated, entry, '')

      testPropertyActive(collectionValue, entry, false)
      testPropertyInitialized(collectionValue, entry, false)
      testPropertyDirty(collectionValue, entry, false)
      testPropertyRaw(collectionValue, entry, undefined)
      testPropertyValue(collectionValue, entry, [])

      testPropertyActive(collectionValueGenerated, entry, false)
      testPropertyInitialized(collectionValueGenerated, entry, false)
      testPropertyDirty(collectionValueGenerated, entry, false)
      testPropertyRaw(collectionValueGenerated, entry, undefined)
      testPropertyValue(collectionValueGenerated, entry, [])
    })

    describe('State: New => Activate', () => {
      const entry = registry.create()
      entry.property(id)!.activate()
      entry.property(singleValue)!.activate()
      entry.property(singleValueGenerated)!.activate()
      entry.property(collectionValue)!.activate()
      entry.property(collectionValueGenerated)!.activate()

      testPropertyActive(id, entry, true)
      testPropertyInitialized(id, entry, false)
      testPropertyDirty(id, entry, false)
      testPropertyRaw(id, entry, undefined)
      testPropertyValue(id, entry, 0)

      testPropertyActive(singleValue, entry, true)
      testPropertyInitialized(singleValue, entry, false)
      testPropertyDirty(singleValue, entry, false)
      testPropertyRaw(singleValue, entry, undefined)
      testPropertyValue(singleValue, entry, '')

      testPropertyActive(singleValueGenerated, entry, true)
      testPropertyInitialized(singleValueGenerated, entry, false)
      testPropertyDirty(singleValueGenerated, entry, false)
      testPropertyRaw(singleValueGenerated, entry, undefined)
      testPropertyValue(singleValueGenerated, entry, '')

      testPropertyActive(collectionValue, entry, true)
      testPropertyInitialized(collectionValue, entry, false)
      testPropertyDirty(collectionValue, entry, false)
      testPropertyRaw(collectionValue, entry, undefined)
      testPropertyValue(collectionValue, entry, [])

      testPropertyActive(collectionValueGenerated, entry, true)
      testPropertyInitialized(collectionValueGenerated, entry, false)
      testPropertyDirty(collectionValueGenerated, entry, false)
      testPropertyRaw(collectionValueGenerated, entry, undefined)
      testPropertyValue(collectionValueGenerated, entry, [])
    })

    describe('State: New => Initialize', () => {
      const entry = registry.create()
      entry.property(id)!.initialize()
      entry.property(singleValue)!.initialize()
      entry.property(singleValueGenerated)!.initialize()
      entry.property(collectionValue)!.initialize()
      entry.property(collectionValueGenerated)!.initialize()

      testPropertyActive(id, entry, true)
      testPropertyInitialized(id, entry, true)
      testPropertyDirty(id, entry, false)
      testPropertyRaw(id, entry, undefined)
      testPropertyValue(id, entry, 0)

      testPropertyActive(singleValue, entry, true)
      testPropertyInitialized(singleValue, entry, true)
      testPropertyDirty(singleValue, entry, false)
      testPropertyRaw(singleValue, entry, undefined)
      testPropertyValue(singleValue, entry, '')

      testPropertyActive(singleValueGenerated, entry, true)
      testPropertyInitialized(singleValueGenerated, entry, true)
      testPropertyDirty(singleValueGenerated, entry, false)
      testPropertyRaw(singleValueGenerated, entry, undefined)
      testPropertyValue(singleValueGenerated, entry, '')

      testPropertyActive(collectionValue, entry, true)
      testPropertyInitialized(collectionValue, entry, true)
      testPropertyDirty(collectionValue, entry, false)
      testPropertyRaw(collectionValue, entry, undefined)
      testPropertyValue(collectionValue, entry, [])

      testPropertyActive(collectionValueGenerated, entry, true)
      testPropertyInitialized(collectionValueGenerated, entry, true)
      testPropertyDirty(collectionValueGenerated, entry, false)
      testPropertyRaw(collectionValueGenerated, entry, undefined)
      testPropertyValue(collectionValueGenerated, entry, [])
    })

    describe('State: New => Modify', () => {
      const entry = registry.create()
      entry.property(id)!.raw = raw.id
      entry.property(singleValue)!.raw = raw.singleValue
      entry.property(singleValueGenerated)!.raw = raw.singleValueGenerated
      entry.property(collectionValue)!.raw = raw.collectionValue
      entry.property(collectionValueGenerated)!.raw =
        raw.collectionValueGenerated

      testPropertyActive(id, entry, true)
      testPropertyInitialized(id, entry, false)
      testPropertyDirty(id, entry, true)
      testPropertyRaw(id, entry, raw.id)
      testPropertyValue(id, entry, raw.id)

      testPropertyActive(singleValue, entry, true)
      testPropertyInitialized(singleValue, entry, false)
      testPropertyDirty(singleValue, entry, true)
      testPropertyRaw(singleValue, entry, raw.singleValue)
      testPropertyValue(singleValue, entry, raw.singleValue)

      testPropertyActive(singleValueGenerated, entry, true)
      testPropertyInitialized(singleValueGenerated, entry, false)
      testPropertyDirty(singleValueGenerated, entry, true)
      testPropertyRaw(singleValueGenerated, entry, raw.singleValueGenerated)
      testPropertyValue(singleValueGenerated, entry, raw.singleValueGenerated)

      testPropertyActive(collectionValue, entry, true)
      testPropertyInitialized(collectionValue, entry, false)
      testPropertyDirty(collectionValue, entry, true)
      testPropertyRaw(collectionValue, entry, raw.collectionValue)
      testPropertyValue(collectionValue, entry, raw.collectionValue)

      testPropertyActive(collectionValueGenerated, entry, true)
      testPropertyInitialized(collectionValueGenerated, entry, false)
      testPropertyDirty(collectionValueGenerated, entry, true)
      testPropertyRaw(
        collectionValueGenerated,
        entry,
        raw.collectionValueGenerated,
      )
      testPropertyValue(
        collectionValueGenerated,
        entry,
        raw.collectionValueGenerated,
      )
    })

    describe('State: New => Dirty(true)', () => {
      const entry = registry.create()
      entry.property(id)!.dirty = true
      entry.property(singleValue)!.dirty = true
      entry.property(singleValueGenerated)!.dirty = true
      entry.property(collectionValue)!.dirty = true
      entry.property(collectionValueGenerated)!.dirty = true

      testPropertyActive(id, entry, true)
      testPropertyInitialized(id, entry, false)
      testPropertyDirty(id, entry, true)
      testPropertyRaw(id, entry, undefined)
      testPropertyValue(id, entry, 0)

      testPropertyActive(singleValue, entry, true)
      testPropertyInitialized(singleValue, entry, false)
      testPropertyDirty(singleValue, entry, true)
      testPropertyRaw(singleValue, entry, undefined)
      testPropertyValue(singleValue, entry, '')

      testPropertyActive(singleValueGenerated, entry, true)
      testPropertyInitialized(singleValueGenerated, entry, false)
      testPropertyDirty(singleValueGenerated, entry, true)
      testPropertyRaw(singleValueGenerated, entry, undefined)
      testPropertyValue(singleValueGenerated, entry, '')

      testPropertyActive(collectionValue, entry, true)
      testPropertyInitialized(collectionValue, entry, false)
      testPropertyDirty(collectionValue, entry, true)
      testPropertyRaw(collectionValue, entry, undefined)
      testPropertyValue(collectionValue, entry, [])

      testPropertyActive(collectionValueGenerated, entry, true)
      testPropertyInitialized(collectionValueGenerated, entry, false)
      testPropertyDirty(collectionValueGenerated, entry, true)
      testPropertyRaw(collectionValueGenerated, entry, undefined)
      testPropertyValue(collectionValueGenerated, entry, [])
    })
  })
})
