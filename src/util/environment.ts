import { Parser, TypeOf, literal, number, object, string, union } from 'tipets'

const Environment = object({
  CLIENT: union(
    literal('pg'),
    literal('pg-native'),
    literal('sqlite3'),
    literal('better-sqlite3'),
    literal('mysql'),
    literal('mysql2'),
    literal('oracledb'),
    literal('tedious'),
  ),
  HOST: string(),
  PORT: number(),
  USER: string(),
  PASSWORD: string(),
  DATABASE: string(),
})

export type Environment = TypeOf<typeof Environment>

/**
 * Load environment variable from the process. Do not forget to import
 * {@link dotenv}
 *
 * @returns
 */
export function getEnvironment(): Environment {
  return Parser.create().decode(process.env, Environment)
}
