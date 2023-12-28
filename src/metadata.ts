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
  private readonly tables: Map<string, TableMetadata> = new Map()

  public constructor(schemas: Schema[] = []) {
    schemas.forEach((schema) => this.get(schema))
  }

  public get(schema: Schema): TableMetadata {
    const name = readSchema(schema, 'entity', string())
    const table = this.tables.get(name)
    if (table !== undefined) {
      return table
    }

    const newTable = new TableMetadata(name, schema)
    this.tables.set(name, newTable)
    return newTable
  }
}

export class TableMetadata {
  public readonly columns: ColumnMetadata[] = []
  public readonly id: ColumnMetadata

  public constructor(
    public readonly name: string,
    public readonly schema: Schema,
  ) {
    // try to get column
    traverse(
      (schema, prevValue) =>
        ObjectSchema.is(schema)
          ? Object.entries(schema.properties).map(
              ([key, schema]) => new ColumnMetadata(this, key, schema, true),
            )
          : prevValue,
      schema,
    )

    const id = this.columns.find((column) => column.id)
    if (id !== undefined) {
      this.id = id
    } else {
      throw new Error(`"${name}" entity schema must have an id column`)
    }
  }

  public column(name: string): ColumnMetadata | undefined {
    return this.columns.find((col) => col.name === name)
  }
}

export class ColumnMetadata {
  /** Mark if column is an id */
  public readonly id: boolean
  /** Mark if column value is generated */
  public readonly generated: boolean
  /** Mark if column is nullable column */
  public readonly nullable: boolean
  /** Mark if column is collection column */
  public readonly collection: boolean

  public constructor(
    /** {@link TableMetadata} column owner */
    public readonly entity: TableMetadata,
    /** Column name */
    public readonly name: string,
    /** {@link Schema} used to declare column */
    public readonly schema: Schema,
    /** Mark if column is declared in schema or not */
    public readonly declared: boolean = false,
  ) {
    this.id = readSchema(schema, 'id', boolean().optional()) ?? false
    this.generated =
      readSchema(schema, 'generated', boolean().optional()) ?? false
    this.nullable =
      traverse(
        (schema, prevValue) =>
          NullableSchema.is(schema) || OptionalSchema.is(schema) || prevValue,
        schema,
      ) ?? false
    this.collection =
      traverse(
        (schema, prevValue) => ArraySchema.is(schema) || prevValue,
        schema,
      ) ?? false
    entity.columns.push(this)
  }
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
