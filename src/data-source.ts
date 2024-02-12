import { Knex, knex } from 'knex'
import { MetadataRegistry } from './metadata'

/** Maintain connection with the data sources. */
export class DataSource {
  private readonly instance: Knex

  private readonly _metadata: MetadataRegistry = new MetadataRegistry()

  public constructor(options: DataSourceOptions) {
    this.instance = knex({
      client: options.client,
      connection: {
        host: options.host,
        port: options.port,
        user: options.user,
        password: options.password,
        database: options.database,
      },
    })
  }

  /** Get current metadata registry context */
  public metadata(): MetadataRegistry {
    return this._metadata
  }

  /**
   * Start a database transaction
   *
   * @param fn Function executed within transaction context
   * @returns Result of the transaction
   */
  public transaction<T>(fn: TransactionFn<T>): Promise<T> {
    return this.instance.transaction(fn)
  }

  /**
   * Get raw query builder from current data connection.
   *
   * @returns Raw query builder
   */
  public query(): Knex.QueryBuilder {
    return this.instance.queryBuilder()
  }

  public async close(): Promise<void> {
    return this.instance.destroy()
  }
}

export type TransactionFn<T> = (trx: Knex.Transaction) => void | Promise<T>

export interface DataSourceOptions {
  client:
    | 'pg'
    | 'pg-native'
    | 'sqlite3'
    | 'better-sqlite3'
    | 'mysql'
    | 'mysql2'
    | 'oracledb'
    | 'tedious'
  host: string
  port: number
  user: string
  password: string
  database: string
}
