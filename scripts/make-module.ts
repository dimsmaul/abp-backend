import fs from 'fs'
import path from 'path'

const moduleName = process.argv[2]

if (!moduleName) {
  console.error('Please provide a module name: bun make:module <name>')
  process.exit(1)
}

const targetDir = path.join(process.cwd(), 'src', 'modules', moduleName)

if (fs.existsSync(targetDir)) {
  console.error(`Module "${moduleName}" already exists at ${targetDir}`)
  process.exit(1)
}

fs.mkdirSync(targetDir, { recursive: true })

const pascalName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1)

// Templates
const templates = {
  modul: `import { Hono } from 'hono'
import { ${pascalName}Controller } from './${moduleName}.controller'

const ${moduleName}Modul = new Hono()
const controller = new ${pascalName}Controller()

${moduleName}Modul.get('/', (c) => controller.findAll(c))
${moduleName}Modul.get('/:id', (c) => controller.findOne(c))
${moduleName}Modul.post('/', (c) => controller.create(c))

export default ${moduleName}Modul
`,
  controller: `import { Context } from 'hono'
import { ${pascalName}Repository } from './${moduleName}.repository'
import { create${pascalName}Schema } from './${moduleName}.schema'

export class ${pascalName}Controller {
  private repository = new ${pascalName}Repository()

  async findAll(c: Context) {
    const data = await this.repository.findAll()
    return c.json({ data })
  }

  async findOne(c: Context) {
    const id = c.req.param('id')
    const data = await this.repository.findById(id)
    if (!data) return c.json({ message: 'Not found' }, 404)
    return c.json({ data })
  }

  async create(c: Context) {
    const body = await c.req.json()
    const validated = create${pascalName}Schema.safeParse(body)
    
    if (!validated.success) {
      return c.json({ errors: validated.error.flatten() }, 400)
    }

    const data = await this.repository.create(validated.data)
    return c.json({ data }, 201)
  }
}
`,
  repository: `import { db } from '../../lib/database'

export class ${pascalName}Repository {
  async findAll() {
    // return await db.selectFrom('${moduleName}s').selectAll().execute()
    return []
  }

  async findById(id: string | number) {
    // return await db.selectFrom('${moduleName}s').selectAll().where('id', '=', id as any).executeTakeFirst()
    return null
  }

  async create(data: any) {
    // return await db.insertInto('${moduleName}s').values(data).returningAll().executeTakeFirst()
    return data
  }
}
`,
  schema: `import { z } from 'zod'

export const create${pascalName}Schema = z.object({
  // Define your schema here
  name: z.string().min(1),
})

export type Create${pascalName}Input = z.infer<typeof create${pascalName}Schema>
`
}

// Write files
const files = [
  { name: `${moduleName}.modul.ts`, content: templates.modul },
  { name: `${moduleName}.controller.ts`, content: templates.controller },
  { name: `${moduleName}.repository.ts`, content: templates.repository },
  { name: `${moduleName}.schema.ts`, content: templates.schema },
]

files.forEach(file => {
  const filePath = path.join(targetDir, file.name)
  fs.writeFileSync(filePath, file.content)
  console.log(`Created: ${filePath}`)
})

console.log(`\nModule "${moduleName}" created successfully!`)
