import {
  ArraySchema,
  NullableSchema,
  ObjectSchema,
  OptionalSchema,
  Schema,
  TypeOf,
  boolean,
  string,
} from 'tipets'

export class MetadataRegistry {
  private readonly tables: Map<Schema, TableMetadata> = new Map()

  public constructor(schemas: Schema[] = []) {
    schemas.forEach((schema) => this.get(schema))
  }

  public get(schema: Schema): TableMetadata {
    const table = this.tables.get(schema)
    if (table !== undefined) {
      return table
    }

    const newTable = new TableMetadata(schema)
    this.tables.set(schema, newTable)
    return newTable
  }
}

export class TableMetadata {
  public readonly name: string
  public readonly columns: ColumnMetadata[] = []
  public readonly id: ColumnMetadata

  public constructor(public readonly schema: Schema) {
    this.name = readSchema(schema, 'entity', string())
    // try to get column
    traverse(
      (schema, prevValue) =>
        ObjectSchema.is(schema)
          ? Object.entries(schema.properties).map(([key, schema]) =>
              createColumn(this, key, schema, true),
            )
          : prevValue,
      schema,
    )

    const id = this.columns.find((column) => column.id)
    if (id !== undefined) {
      this.id = id
    } else {
      throw new Error(`"${this.name}" entity schema must have an id column`)
    }
  }

  public column(name: string): ColumnMetadata | undefined {
    return this.columns.find((col) => col.name === name)
  }
}

function createColumn(
  table: TableMetadata,
  name: string,
  schema: Schema,
  declared: boolean = false,
): ColumnMetadata {
  const id: boolean = readSchema(schema, 'id', boolean().optional()) ?? false
  const generated: boolean =
    readSchema(schema, 'generated', boolean().optional()) ?? false
  const nullable: boolean =
    traverse(
      (schema, prevValue) =>
        NullableSchema.is(schema) || OptionalSchema.is(schema) || prevValue,
      schema,
    ) ?? false
  const collection: boolean =
    traverse(
      (schema, prevValue) => ArraySchema.is(schema) || prevValue,
      schema,
    ) ?? false
  const column: ColumnMetadata = {
    table,
    name,
    schema,
    declared,
    id,
    generated,
    nullable,
    collection,
  }
  table.columns.push(column)
  return column
}

export interface ColumnMetadata {
  /** {@link TableMetadata} column owner */
  readonly table: TableMetadata
  /** Column name */
  readonly name: string
  /** {@link Schema} used to declare column */
  readonly schema: Schema
  /** Mark if column is declared in schema or not */
  readonly declared: boolean
  /** Mark if column is an id */
  readonly id: boolean
  /** Mark if column value is generated */
  readonly generated: boolean
  /** Mark if column is nullable column */
  readonly nullable: boolean
  /** Mark if column is collection column */
  readonly collection: boolean
}

/**
 * Read given {@link Schema} for given name metadata value
 *
 * @param schema {@link Schema} to be read
 * @param name Metadata attribute name
 * @param type Type or {@link Schema} used to read metadata value
 * @returns A value if metadata exists, undefined otherwise
 */
function readSchema<S extends Schema>(
  schema: Schema,
  name: string,
  type: S,
): TypeOf<S> {
  const value = traverse<TypeOf<S>>(
    (schema, prevValue) => schema.get(name) ?? prevValue,
    schema,
  )
  if (type.is(value)) {
    return value
  }
  throw new Error(`Cannot read "${name}" metadata value from given schema`)
}

/**
 * Read deepest {@link Schema} for its value using given function and return its
 * value
 *
 * @param fn A function to read given schema and return a value
 * @param schema {@link Schema} to be traversed
 */
function traverse<T>(
  fn: (schema: Schema, previousValue: T | undefined) => T | undefined,
  schema: Schema,
): T | undefined {
  const previousValue =
    ArraySchema.is(schema) ||
    NullableSchema.is(schema) ||
    OptionalSchema.is(schema)
      ? fn(schema.type, undefined)
      : undefined
  return fn(schema, previousValue)
}
