# Standalone hosted Commands fixture

This fixture proves both hosted external-app bootstrap paths against a real
Alien deployment:

- `receiver.mjs` calls `createCommandReceiver({ deploymentId, apiKey, target })`
  and serves `resize-image` with `receiver.command(...)`.
- `invoke.mjs` calls `CommandsClient.forDeployment({ deploymentId, apiKey })`,
  targets `external-image-processor`, invokes `resize-image`, and asserts the
  exact resized RGBA output.

The Alien API key is used only for Platform bootstrap. The package discovers
the deployment's current manager and uses short-lived sender/receiver command
capabilities for manager requests.

## Package under test

Until the hosted onboarding change is published to npm, the fixture vendors the
56 KiB `pnpm pack` output built from Alien commit
`6d5c74fa26ccea153d3d0dd807ba867334ba802d` (PR #269). This makes the example
reproducible without a developer-local symlink. Replace the tarball dependency
with the released package version after publication.

Tarball SHA-256:
`ffe1840974b70a6ec27f4937b9443711c59a91ddcc07dbb6f27ac0cbc6b07a70`.

## Deploy

Run release/deployment setup from this directory so Alien loads this
`alien.ts`. The deployment contains a command-enabled Daemon named
`external-image-processor`; its deployed Alpine placeholder deliberately does
not lease commands because the external receiver serves that identity.

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
