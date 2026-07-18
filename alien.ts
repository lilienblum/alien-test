import * as alien from "@alienplatform/core"

const index = new alien.Kv("index").build()

const compute = new alien.ComputeCluster("compute")
  .pool("general", {
    requirements: {
      cpu: 2,
      memory: "4Gi",
      architecture: "arm64",
    },
    scale: { type: "fixed", machines: 1 },
  })
  .build()

const api = new alien.Worker("api")
  .code({ type: "source", src: "./worker", toolchain: { type: "typescript" } })
  .commandsEnabled(true)
  .publicEndpoint("api")
  .link(index)
  .permissions("execution")
  .build()

const daemon = new alien.Daemon("debug-daemon")
  .code({ type: "source", src: "./daemon", toolchain: { type: "typescript" } })
  // Cloud deployments require an explicit cluster name. The deployment
  // preflight synthesizes this setup-owned cluster; Local and Kubernetes
  // ignore the field.
  .cluster("compute")
  .pool("general")
  .commandsEnabled(true)
  .link(index)
  .permissions("execution")
  .build()

export default new alien.Stack("alien-debug-fixture")
  .platforms(["local", "kubernetes", "aws"])
  .add(compute, "frozen")
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
