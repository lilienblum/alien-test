import { command } from "@alienplatform/sdk"
import { Hono } from "hono"
import { resizeRgba } from "./image.js"

const app = new Hono()

app.get("/hello", context => context.json({ ok: true, runtime: "worker" }))
app.get("/health", context => context.json({ status: "healthy" }))

command("resize-image", input => {
  const result = resizeRgba(input)
  console.log(JSON.stringify({ event: "resize-image-handled", runtime: "worker", result }))
  return result
})

export default app
