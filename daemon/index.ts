import { kv } from "@alienplatform/bindings"
import { createCommandReceiver } from "@alienplatform/commands"

const RESOURCE = "debug-daemon"
const index = kv("index")
const seed = {
  "doc:one": "daemon wrote this document",
  "doc:two": "shared kv is working",
}

for (const [key, value] of Object.entries(seed)) {
  await index.set(key, value)
}

const receiver = createCommandReceiver()

receiver.handle("status", async () => {
  const documents = await index.list({ prefix: "doc:" })
  return {
    resource: RESOURCE,
    role: "daemon",
    model: "pull",
    documents: documents.length,
  }
})

console.log(`${RESOURCE} started; seeded shared KV`)
await receiver.run()
