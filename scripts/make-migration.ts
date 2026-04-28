import fs from 'fs'
import path from 'path'

const migrationName = process.argv[2]

if (!migrationName) {
  console.error('Please provide a migration name: bun db:make <name>')
  process.exit(1)
}

const migrationsDir = path.join(process.cwd(), 'src', 'database', 'migrations')

if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true })
}

const timestamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0]
const fileName = `${timestamp}_${migrationName}.ts`
const filePath = path.join(migrationsDir, fileName)

const template = `import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // await db.schema
  //   .createTable('your_table')
  //   .addColumn('id', 'serial', (col) => col.primaryKey())
  //   .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  // await db.schema.dropTable('your_table').execute()
}
`

fs.writeFileSync(filePath, template)
console.log(`Created migration: ${filePath}`)
