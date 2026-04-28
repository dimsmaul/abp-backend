import { createApp } from './app'

const app = createApp()

export default {
  port: 4000,
  fetch: app.fetch,
}
