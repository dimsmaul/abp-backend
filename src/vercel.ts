import { handle } from 'hono/vercel'
import { createApp } from './app'

const app = createApp()

export default handle(app)
