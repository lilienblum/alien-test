import * as alien from "@alienplatform/core"

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

// This deployed process deliberately does not lease commands. It supplies the
// command-enabled Daemon identity that the external receiver serves.
const externalImageProcessor = new alien.Daemon("external-image-processor")
  .code({ type: "image", image: "alpine:3.21" })
  .command(["sh", "-c", "while true; do sleep 3600; done"])
  .cluster("compute")
  .pool("general")
  .permissions("execution")
  .commandsEnabled(true)
  .build()

export default new alien.Stack("standalone-commands-fixture")
  .platforms(["aws"])
  .add(compute, "frozen")
  .add(externalImageProcessor, "live")
  .permissions({ profiles: { execution: {} } })
  .build()
