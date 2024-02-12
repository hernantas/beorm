import { number, object, string } from 'tipets'
import { MetadataRegistry } from './metadata'

describe('Table Metadata', () => {
  const schema = object({
    normal: string(),
    id: number().set('id', true),
    generated: number().set('generated', true),
    nullable: string().nullable(),
    optional: string().optional(),
    collection: string().array(),
  }).set('entity', 'entity_name')
  const table = new MetadataRegistry().get(schema)

  it('Should have table name set in the metadata', () => {
    expect(table.name).toEqual('entity_name')
  })

  it('Table metadata should have 6 properties', () => {
    expect(table.columns).toHaveLength(6)
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
