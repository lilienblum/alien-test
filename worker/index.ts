import { command, kv } from "@alienplatform/sdk"
import { Hono } from "hono"

const RESOURCE = "api"
const index = kv("index")

async function countDocuments(): Promise<number> {
  return (await index.scan("doc:")).items.length
}

command("status", async () => ({
  resource: RESOURCE,
  role: "worker",
  model: "push",
  documents: await countDocuments(),
}))

const app = new Hono()

app.get("/health", c => c.json({ status: "ok", resource: RESOURCE }))

app.get("/status", async c =>
  c.json({ resource: RESOURCE, documents: await countDocuments() }),
)

app.get("/kv", async c => {
  const documents = (await index.scan("doc:")).items
  return c.json({
    resource: RESOURCE,
    documents: documents.map(item => ({
      key: item.key,
      value: new TextDecoder().decode(item.value),
    })),
  })
})

export default app
