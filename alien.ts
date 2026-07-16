import * as alien from "@alienplatform/core"

const index = new alien.Kv("index").build()

const api = new alien.Worker("api")
  .code({ type: "source", src: "./worker", toolchain: { type: "typescript" } })
  .commandsEnabled(true)
  .publicEndpoint("api")
  .link(index)
  .permissions("execution")
  .build()

const daemon = new alien.Daemon("debug-daemon")
  .code({ type: "source", src: "./daemon", toolchain: { type: "typescript" } })
  .commandsEnabled(true)
  .link(index)
  .permissions("execution")
  .build()

export default new alien.Stack("alien-debug-fixture")
  .platforms(["local", "kubernetes", "aws"])
  .add(index, "frozen")
  .add(api, "live")
  .add(daemon, "live")
  .permissions({
    profiles: {
      execution: {
        "*": ["kv/data-read", "kv/data-write"]
      }
    }
  })
  .build()
