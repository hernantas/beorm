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
    this.name = SchemaReader.entity(schema)
    // try to get column
    SchemaReader.traverse(
      (schema, innerValue) =>
        ObjectSchema.is(schema)
          ? Object.entries(schema.properties).map(([key, schema]) =>
              createColumn(this, key, schema, true),
            )
          : innerValue,
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
  const id: boolean = SchemaReader.id(schema)
  const generated: boolean = SchemaReader.generated(schema)
  const nullable: boolean = SchemaReader.nullable(schema)
  const collection: boolean = SchemaReader.collection(schema)

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

class SchemaReader {
  /**
   * Read deepest {@link Schema} for its value using given function and return
   * its value
   *
   * @param fn A function to read given schema and return a value
   * @param schema {@link Schema} to be traversed
   */
  public static traverse<T>(
    fn: (schema: Schema, innerValue: T | undefined) => T | undefined,
    schema: Schema,
  ): T | undefined {
    const innerValue =
      ArraySchema.is(schema) ||
      NullableSchema.is(schema) ||
      OptionalSchema.is(schema)
        ? SchemaReader.traverse(fn, schema.type)
        : undefined
    return fn(schema, innerValue)
  }

  public static nullable(schema: Schema): boolean {
    return (
      SchemaReader.traverse(
        (schema) => NullableSchema.is(schema) || OptionalSchema.is(schema),
        schema,
      ) ?? false
    )
  }

  public static collection(schema: Schema): boolean {
    return (
      SchemaReader.traverse(
        (schema, innerValue) => ArraySchema.is(schema) || innerValue,
        schema,
      ) ?? false
    )
  }

  /**
   * Read given {@link Schema} for given name metadata value
   *
   * @param schema {@link Schema} to be read
   * @param name Metadata attribute name
   * @param type Type or {@link Schema} used to read metadata value
   * @returns A value if metadata exists, undefined otherwise
   */
  public static read<S extends Schema>(
    schema: Schema,
    name: string,
    type: S,
  ): TypeOf<S> {
    const value = SchemaReader.traverse<TypeOf<S>>(
      (schema, innerValue) => schema.get(name) ?? innerValue,
      schema,
    )
    if (type.is(value)) {
      return value
    }
    throw new Error(`Cannot read "${name}" metadata value from given schema`)
  }

  public static entity(schema: Schema): string {
    return SchemaReader.read(schema, 'entity', string())
  }

  public static id(schema: Schema): boolean {
    return SchemaReader.read(schema, 'id', boolean().optional()) ?? false
  }

  public static generated(schema: Schema): boolean {
    return SchemaReader.read(schema, 'generated', boolean().optional()) ?? false
  }
}
