import { number, object, string } from 'tipets'
import { Metadata } from './metadata'

describe('Table Metadata', () => {
  const schema = object({
    normal: string(),
    id: number().set('id', true),
    generated: number().set('generated', true),
    nullable: string().nullable(),
    optional: string().optional(),
    collection: string().array(),
  }).set('entity', 'entity_name')
  const table = new Metadata().get(schema)

  it('Should have table name set in the metadata', () => {
    expect(table.name).toEqual('entity_name')
  })

  it('Table metadata should have 6 properties', () => {
    expect(table.baseColumns).toHaveLength(6)
  })

  describe('Property Metadata', () => {
    it('"normal" property metadata should be declared and sets correctly', () => {
      const property = table.column('normal')
      expect(property).not.toBeUndefined()
      expect(property!.table).toBe(table)
      expect(property!.name).toBe('normal')
      expect(property!.id).toBe(false)
      expect(property!.generated).toBe(false)
      expect(property!.nullable).toBe(false)
      expect(property!.collection).toBe(false)
    })

    it('"id" property metadata should be declared and sets correctly', () => {
      const property = table.column('id')
      expect(property).not.toBeUndefined()
      expect(property!.table).toBe(table)
      expect(property!.name).toBe('id')
      expect(property!.id).toBe(true)
      expect(property!.generated).toBe(false)
      expect(property!.nullable).toBe(false)
      expect(property!.collection).toBe(false)
    })

    it('"generated" property metadata should be declared and sets correctly', () => {
      const property = table.column('generated')
      expect(property).not.toBeUndefined()
      expect(property!.table).toBe(table)
      expect(property!.name).toBe('generated')
      expect(property!.id).toBe(false)
      expect(property!.generated).toBe(true)
      expect(property!.nullable).toBe(false)
      expect(property!.collection).toBe(false)
    })

    it('"nullable" property metadata should be declared and sets correctly', () => {
      const property = table.column('nullable')
      expect(property).not.toBeUndefined()
      expect(property!.table).toBe(table)
      expect(property!.name).toBe('nullable')
      expect(property!.id).toBe(false)
      expect(property!.generated).toBe(false)
      expect(property!.nullable).toBe(true)
      expect(property!.collection).toBe(false)
    })

    it('"optional" property metadata should be declared and sets correctly', () => {
      const property = table.column('optional')
      expect(property).not.toBeUndefined()
      expect(property!.table).toBe(table)
      expect(property!.name).toBe('optional')
      expect(property!.id).toBe(false)
      expect(property!.generated).toBe(false)
      expect(property!.nullable).toBe(true)
      expect(property!.collection).toBe(false)
    })

    it('"collection" property metadata should be declared and sets correctly', () => {
      const property = table.column('collection')
      expect(property).not.toBeUndefined()
      expect(property!.table).toBe(table)
      expect(property!.name).toBe('collection')
      expect(property!.id).toBe(false)
      expect(property!.generated).toBe(false)
      expect(property!.nullable).toBe(false)
      expect(property!.collection).toBe(true)
    })
  })
})

describe('Table Metadata with Relation Columns', () => {
  const foreignSchema = object({
    id: number().set('id', true).set('generated', true),
  }).set('entity', 'entity_foreign')

  describe('To-One Relation', () => {
    describe('Source table as owner', () => {
      const schema = object({
        id: number().set('id', true).set('generated', true),
        rel: foreignSchema,
      }).set('entity', 'entity')
      const metadata = new Metadata()
      const sourceTable = metadata.get(schema)
      const foreignTable = metadata.get(foreignSchema)

      it('Table should have 2 base & 1 relation columns', () => {
        expect(sourceTable.baseColumns).toHaveLength(2)
        expect(sourceTable.relationColumns).toHaveLength(1)
      })

      it('Table should have 1 base & 0 relation columns', () => {
        expect(foreignTable.baseColumns).toHaveLength(1)
        expect(foreignTable.relationColumns).toHaveLength(0)
      })

      it('Join column should be automatically created at source table', () => {
        expect(sourceTable.column('entity_foreign_id')).not.toBeUndefined()
      })
    })

    describe('Foreign table as owner', () => {
      const schema = object({
        id: number().set('id', true).set('generated', true),
        rel: foreignSchema.set('owner', 'foreign'),
      }).set('entity', 'entity')
      const metadata = new Metadata()
      const sourceTable = metadata.get(schema)
      const foreignTable = metadata.get(foreignSchema)

      it('Table should have 2 base & 1 relation columns', () => {
        expect(sourceTable.baseColumns).toHaveLength(1)
        expect(sourceTable.relationColumns).toHaveLength(1)
      })

      it('Table should have 1 base & 0 relation columns', () => {
        expect(foreignTable.baseColumns).toHaveLength(2)
        expect(foreignTable.relationColumns).toHaveLength(0)
      })

      it('Join column should be automatically created at source table', () => {
        expect(foreignTable.column('entity_id')).not.toBeUndefined()
      })
    })
  })

  describe('To-Many Relation', () => {
    const schema = object({
      id: number().set('id', true).set('generated', true),
      rel: foreignSchema.array(),
    }).set('entity', 'entity')
    const metadata = new Metadata()
    const sourceTable = metadata.get(schema)
    const foreignTable = metadata.get(foreignSchema)

    it('Source Table should have 1 base & 1 relation columns', () => {
      expect(sourceTable.baseColumns).toHaveLength(1)
      expect(sourceTable.relationColumns).toHaveLength(1)
    })

    it('Foreign Table should have 2 base & 0 relation columns', () => {
      expect(foreignTable.baseColumns).toHaveLength(2)
      expect(foreignTable.relationColumns).toHaveLength(0)
    })

    it('Join column should be automatically created at foreign table', () => {
      expect(foreignTable.column('entity_id')).not.toBeUndefined()
    })
  })
})
