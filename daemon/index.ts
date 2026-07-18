import { kv } from "@alienplatform/bindings"
import { createCommandReceiver } from "@alienplatform/commands"

const RESOURCE = "debug-daemon"
const index = kv("index")
const seed = {
  "doc:one": "daemon wrote this document",
  "doc:two": "shared kv is working",
}

async function main(): Promise<void> {
  for (const [key, value] of Object.entries(seed)) {
    await index.set(key, value)
  }

  const receiver = createCommandReceiver()

  receiver.handle("status", async () => ({
    resource: RESOURCE,
    role: "daemon",
    model: "pull",
    documents: (await index.scan("doc:")).items.length,
  }))

  console.log(`${RESOURCE} started; seeded shared KV and command receiver ready`)
  await receiver.run()
}

void main()
