import { Pool } from 'pg'
import { Kysely, PostgresDialect } from 'kysely'
import { Database } from './types'

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.DATABASE_URL || `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  })
})

export const db = new Kysely<Database>({
  dialect,
})
