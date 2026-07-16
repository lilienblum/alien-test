# Alien debug fixture

Minimal manual fixture for runtime-less Daemon + KV + command routing.

Resources:

- `api`: HTTP Worker with `/health`, `/status`, and `/kv`
- `debug-daemon`: runtime-less Daemon that seeds shared KV and leases `status`
- `index`: shared KV binding

Both resources expose `status`, so invoke with an explicit target.

## Local

```sh
alien dev
```

Then inspect the Worker endpoint and invoke:

```sh
curl http://<worker-url>/health
curl http://<worker-url>/kv
```

Expected command results:

- target `api`: role `worker`, model `push`
- target `debug-daemon`: role `daemon`, model `pull`
- both report the same KV document count
