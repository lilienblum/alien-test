import { command, kv } from "@alienplatform/sdk"
import { Hono } from "hono"

const RESOURCE = "api"
const index = kv("index")

command("status", async () => ({
  resource: RESOURCE,
  role: "worker",
  model: "push",
  documents: await index.list({ prefix: "doc:" }).then(items => items.length),
}))

const app = new Hono()

app.get("/health", c => c.json({ status: "ok", resource: RESOURCE }))

app.get("/status", async c => {
  const documents = await index.list({ prefix: "doc:" })
  return c.json({ resource: RESOURCE, documents: documents.length })
})

app.get("/kv", async c => {
  const documents = await index.list({ prefix: "doc:" })
  return c.json({ resource: RESOURCE, documents })
})

export default app
