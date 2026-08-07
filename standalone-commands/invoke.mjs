import { CommandsClient } from "@alienplatform/commands"

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

const deploymentId = requireEnv("ALIEN_DEPLOYMENT_ID")
const apiKey = requireEnv("ALIEN_API_KEY")
const target = process.env.ALIEN_COMMAND_TARGET ?? "external-image-processor"
const platformUrl = process.env.ALIEN_PLATFORM_URL

const sourceRgba = Buffer.from([
  255, 0, 0, 255,
  0, 255, 0, 255,
  0, 0, 255, 255,
  255, 255, 255, 255,
])

const commands = await CommandsClient.forDeployment({
  deploymentId,
  apiKey,
  platformUrl,
  timeoutMs: 120_000,
})

const result = await commands.target(target).invoke(
  "resize-image",
  {
    sourceWidth: 2,
    sourceHeight: 2,
    targetWidth: 1,
    targetHeight: 1,
    rgbaBase64: sourceRgba.toString("base64"),
  },
  {
    pollIntervalMs: 250,
    maxPollIntervalMs: 1_000,
  },
)

const expected = {
  format: "rgba",
  width: 1,
  height: 1,
  rgbaBase64: "/wAA/w==",
}
if (JSON.stringify(result) !== JSON.stringify(expected)) {
  throw new Error(`Unexpected resize-image result: ${JSON.stringify(result)}`)
}

console.log(JSON.stringify({ ok: true, command: "resize-image", deploymentId, target, result }))
