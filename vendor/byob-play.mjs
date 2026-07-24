// BYOB vendor-backend playground (ALIEN-291).
//
// This is the "vendor" side of Bring Your Own Bucket: an external backend that
// holds only an Alien deployment id + API token and talks to a Storage resource
// that lives in the customer's own cloud account. No Alien worker/container runs
// here — this is a plain Node process.
//
// It imports the locally-built 291 bindings package directly (the same path the
// repo's own scripts/remote-storage-smoke.mjs uses), so no install step is
// needed. In a real vendor project you would instead:
//     import { Bindings } from "@alienplatform/bindings"
//
// Usage (from alien-test-byob/vendor):
//   export ALIEN_API_URL=https://api.alien.localhost
//   export ALIEN_API_TOKEN=<deployment-scoped token with write access>
//   export ALIEN_DEPLOYMENT_ID=dep_...
//   export ALIEN_STORAGE_BINDING=test-alien-storage
//   node byob-play.mjs            # full put/get/head/list/delete lifecycle
//   node byob-play.mjs deny       # expect resolution/credentials to be refused
//   node byob-play.mjs refresh 20 # hold one Bindings object, put once/min for 20 min

import { randomUUID } from "node:crypto"
import { Bindings } from "../../alien/packages/bindings/dist/index.js"

function env(name, fallback) {
  const v = process.env[name]?.trim()
  if (v) return v
  if (fallback !== undefined) return fallback
  throw new Error(`missing required env var ${name}`)
}

const config = {
  apiBaseUrl: env("ALIEN_API_URL", "https://api.alien.localhost"),
  token: env("ALIEN_API_TOKEN"),
  deploymentId: env("ALIEN_DEPLOYMENT_ID"),
  binding: env("ALIEN_STORAGE_BINDING", "test-alien-storage"),
}

const mode = process.argv[2] ?? "lifecycle"

function log(step, detail) {
  console.log(`\n▶ ${step}${detail ? `  — ${detail}` : ""}`)
}

async function connect() {
  log("Bindings.forRemoteDeployment", `deployment=${config.deploymentId} binding=${config.binding}`)
  const bindings = await Bindings.forRemoteDeployment({
    apiBaseUrl: config.apiBaseUrl,
    deploymentId: config.deploymentId,
    token: config.token,
  })
  const storage = bindings.storage(config.binding)
  return { bindings, storage }
}

async function lifecycle() {
  const { storage } = await connect()
  const object = `byob-play/${randomUUID()}/hello.txt`
  const payload = new TextEncoder().encode("hello from the vendor backend")
  const prefix = object.slice(0, object.lastIndexOf("/") + 1)

  log("put", object)
  await storage.put(object, payload)

  log("head", object)
  const meta = await storage.head(object)
  console.log("  meta:", meta)

  log("get", object)
  const got = await storage.get(object)
  console.log("  contents:", new TextDecoder().decode(got))
  if (new TextDecoder().decode(got) !== "hello from the vendor backend") {
    throw new Error("get returned unexpected contents")
  }

  log("list", prefix)
  const listed = await storage.list(prefix)
  console.log("  entries:", listed.map(e => e.location))
  if (!listed.some(e => e.location === object)) {
    throw new Error("uploaded object missing from list")
  }

  log("delete", object)
  await storage.delete(object)
  const after = await storage.list(prefix)
  if (after.some(e => e.location === object)) {
    throw new Error("object still present after delete")
  }
  console.log("  confirmed gone after delete")

  console.log("\n✅ BYOB lifecycle passed (put/get/head/list/delete)")
}

// Security surface: resolution or credential minting must fail closed for
// read-only tokens, the wrong deployment, or a resource without remoteAccess.
async function deny() {
  log("deny probe", "expecting resolution/credentials to be REFUSED")
  try {
    const { storage } = await connect()
    // The refusal can surface either at resolve time or on first operation.
    await storage.list("")
    console.error("\n❌ UNEXPECTED: access was granted; BYOB did not fail closed")
    process.exitCode = 1
  } catch (error) {
    console.log("\n✅ denied as expected:")
    console.log(`  ${error?.message ?? error}`)
  }
}

async function refresh(minutesArg) {
  const minutes = Number(minutesArg ?? "20")
  const { storage } = await connect()
  const started = Date.now()
  const deadline = started + minutes * 60_000
  let i = 0
  log("refresh loop", `holding one Bindings object for ${minutes} min, one put/min`)
  while (Date.now() < deadline) {
    const object = `byob-play/refresh/${randomUUID()}.txt`
    await storage.put(object, new TextEncoder().encode(`tick ${i}`))
    await storage.delete(object)
    const mins = ((Date.now() - started) / 60_000).toFixed(1)
    console.log(`  [${mins}m] tick ${i} ok (creds refreshed under the API if needed)`)
    i += 1
    await new Promise(r => setTimeout(r, 60_000))
  }
  console.log("\n✅ refresh loop completed without reconstructing Bindings")
}

const handlers = { lifecycle, deny, refresh: () => refresh(process.argv[3]) }
const handler = handlers[mode]
if (!handler) {
  console.error(`unknown mode "${mode}". use: lifecycle | deny | refresh <minutes>`)
  process.exit(2)
}
await handler()
