import { Knex, knex } from 'knex'

/** Maintain connection with the data sources. */
export class DataSource {
  private readonly instance: Knex

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

  /**
   * Get raw query builder from current data connection.
   *
   * @returns Raw query builder
   */
  public rawQuery(): Knex.QueryBuilder {
    return this.instance.queryBuilder()
  }
}

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
