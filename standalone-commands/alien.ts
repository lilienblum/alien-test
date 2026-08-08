import * as alien from "@alienplatform/core"

type FixturePlatform = "aws" | "gcp"
type FixtureTarget = "daemon" | "worker"

function fixturePlatform(): FixturePlatform {
  const value = process.env.ALIEN_FIXTURE_PLATFORM ?? "aws"
  if (value === "aws" || value === "gcp") return value
  throw new Error(`ALIEN_FIXTURE_PLATFORM must be "aws" or "gcp"; received "${value}"`)
}

function fixtureTarget(): FixtureTarget {
  const value = process.env.ALIEN_FIXTURE_TARGET ?? "daemon"
  if (value === "daemon" || value === "worker") return value
  throw new Error(`ALIEN_FIXTURE_TARGET must be "daemon" or "worker"; received "${value}"`)
}

function workerStack(platform: FixturePlatform) {
  const worker = new alien.Worker("external-image-processor")
    .code({ type: "source", src: "./worker", toolchain: { type: "typescript" } })
    .permissions("execution")
    .commandsEnabled(true)

  // AWS also covers the user-facing HTTP endpoint readiness path. GCP needs a
  // public endpoint until private Cloud Run ingress is emitted with a valid v2
  // API enum, but the Commands assertion itself uses Pub/Sub push delivery.
  const externalImageProcessor =
    platform === "aws"
      ? worker
          .publicEndpoint("http")
          .readinessProbe({ method: "GET", path: "/hello" })
          .build()
      : worker.publicEndpoint("http").build()

  return new alien.Stack("standalone-commands-worker-fixture")
    .platforms([platform])
    .add(externalImageProcessor, "live")
    .permissions({ profiles: { execution: {} } })
    .build()
}

function daemonStack(platform: FixturePlatform) {
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

  // This deployed process deliberately does not lease commands. It supplies
  // the command-enabled Daemon identity that the external receiver serves.
  const externalImageProcessor = new alien.Daemon("external-image-processor")
    .code({ type: "image", image: "alpine:3.21" })
    .command(["sh", "-c", "while true; do sleep 3600; done"])
    .cluster("compute")
    .pool("general")
    .permissions("execution")
    .commandsEnabled(true)
    .build()

  return new alien.Stack("standalone-commands-daemon-fixture")
    .platforms([platform])
    .add(compute, "frozen")
    .add(externalImageProcessor, "live")
    .permissions({ profiles: { execution: {} } })
    .build()
}

const platform = fixturePlatform()
export default fixtureTarget() === "worker" ? workerStack(platform) : daemonStack(platform)
