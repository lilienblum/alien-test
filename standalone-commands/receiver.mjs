import { createCommandReceiver } from "@alienplatform/commands"
import { resizeRgba } from "./image.mjs"

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

const deploymentId = requireEnv("ALIEN_DEPLOYMENT_ID")
const apiKey = requireEnv("ALIEN_API_KEY")
const target = process.env.ALIEN_COMMAND_TARGET ?? "external-image-processor"
const platformUrl = process.env.ALIEN_PLATFORM_URL

const receiver = createCommandReceiver({
  deploymentId,
  apiKey,
  target,
  platformUrl,
  pollIntervalMs: 250,
  pollMaxIntervalMs: 1_000,
  pollJitter: 0,
})

receiver.command("resize-image", async input => {
  const result = resizeRgba(input)
  console.log(JSON.stringify({ event: "resize-image-handled", deploymentId, target, result }))
  setTimeout(() => receiver.stop(), 0)
  return result
})

process.once("SIGINT", () => receiver.stop())
process.once("SIGTERM", () => receiver.stop())

console.log(JSON.stringify({ event: "external-receiver-starting", deploymentId, target }))
await receiver.run()
console.log(JSON.stringify({ event: "external-receiver-stopped", deploymentId, target }))
