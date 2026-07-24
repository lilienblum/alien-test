# BYOB vendor playground (ALIEN-291)

The **vendor-backend** side of Bring Your Own Bucket. This process holds only an
Alien deployment id + API token and reads/writes a Storage resource that lives in
the *customer's* cloud account. No Alien worker or container runs here.

It imports the locally-built 291 bindings (`../../alien/packages/bindings/dist`)
directly, so there is no install step — but you must build the addon first:

```sh
cd ../../alien
pnpm --filter @alienplatform/bindings run build:addon   # native napi addon
pnpm --filter @alienplatform/bindings run build          # dist/
```

## Run

You need a **live cloud deployment** with a Frozen, remote-access Storage
resource in `Running` state (stand one up with the platform e2e harness). Then:

```sh
export ALIEN_API_URL=https://api.alien.localhost
export ALIEN_API_TOKEN=<deployment-scoped token, write access>
export ALIEN_DEPLOYMENT_ID=dep_...
export ALIEN_STORAGE_BINDING=test-alien-storage

node byob-play.mjs             # put → head → get → list → delete
node byob-play.mjs deny        # with a read-only token / no-remoteAccess resource: expect refusal
node byob-play.mjs refresh 20  # hold one Bindings object 20 min; watch creds rotate under the API
```

BYOB is **cloud-only**: remote resolution rejects any non-AWS/GCP/Azure
deployment, so `alien dev` / local cannot exercise this path.
