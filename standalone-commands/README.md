# Standalone hosted Commands fixture

This fixture exercises hosted external-app Commands against real Alien deployments:

- `receiver.mjs` calls `createCommandReceiver({ deploymentId, apiKey, target })`
  and serves `resize-image` for the pull-based Daemon target.
- `worker/index.ts` registers the same command with the Worker SDK so Alien can
  push it through Lambda on AWS or Pub/Sub/Cloud Run on GCP.
- `invoke.mjs` calls `CommandsClient.forDeployment({ deploymentId, apiKey })`,
  targets `external-image-processor`, invokes `resize-image`, and asserts the
  exact resized RGBA output.

The Alien API key is used only for Platform bootstrap. The package discovers
the deployment's current manager and uses short-lived sender/receiver command
capabilities for manager requests.

## Package under test

Until the hosted onboarding change is published to npm, the fixture vendors the
56 KiB `pnpm pack` output built from Alien commit
`4965baf86ef602c2c0746628ac96a9d9f10c9d2e` (PR #269). This makes the example
reproducible without a developer-local symlink. Replace the tarball dependency
with the released package version after publication.

Tarball SHA-256:
`7c843596c5ed76411d9635f3f6a41c4dad96667b8870f5df2af70c9c53d69e28`.

## Deploy

Run release/deployment setup from this directory so Alien loads this `alien.ts`.

The default remains the command-enabled Daemon used by the external receiver.
Its deployed Alpine placeholder deliberately does not lease commands because
the external receiver serves that identity.

Select a provider-native Worker deployment with:

```sh
ALIEN_FIXTURE_TARGET=worker ALIEN_FIXTURE_PLATFORM=aws alien build --platform aws
ALIEN_FIXTURE_TARGET=worker ALIEN_FIXTURE_PLATFORM=gcp alien build --platform gcp
```

The Worker registers `resize-image` with `@alienplatform/sdk`. Do not run
`receiver.mjs` for Worker tests: Alien leases the command and pushes it through
the provider-native transport into `alien-worker-runtime`.

The AWS variant also exposes `/hello` publicly and uses it as a readiness probe.
The GCP variant declares a public endpoint because the current Cloud Run v2
controller emits an invalid ingress enum for a Worker with no public endpoint.
A successful Commands assertion exercises Pub/Sub push delivery directly; it
does not depend on the external load balancer or custom domain being reachable.

## Exercise the external flow

Install dependencies, then run the receiver and sender in separate terminals:

```sh
npm install

ALIEN_DEPLOYMENT_ID=dep_... \
ALIEN_API_KEY=ax_... \
ALIEN_PLATFORM_URL=https://api.alien.localhost \
npm run receiver
```

```sh
ALIEN_DEPLOYMENT_ID=dep_... \
ALIEN_API_KEY=ax_... \
ALIEN_PLATFORM_URL=https://api.alien.localhost \
npm run invoke
```

The receiver stops after one successful command. The sender exits nonzero unless
the returned 1×1 RGBA image is exactly one opaque red pixel (`/wAA/w==`).

For a Worker deployment, only run the sender command above. The same assertion
then proves the full hosted bootstrap → manager → provider push → Worker SDK →
manager response path.
