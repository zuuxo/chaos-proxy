# chaos-proxy

`chaos-proxy` is a TypeScript reverse proxy for local chaos testing. Point your app at the proxy instead of the real API and inject latency, jitter, errors, timeouts and rate limits.

## Features

- HTTP / HTTPS upstream targets
- latency + jitter
- random injected 4xx/5xx responses
- simulated 504 timeouts
- per-client fixed-window rate limiting
- YAML / JSON configuration
- CLI overrides
- request and response forwarding
- runtime statistics endpoint
- request/response byte counters
- graceful shutdown
- Node.js 20+

## Quick start

```bash
npm install
npm run build
node dist/cli.js --config examples/chaos-proxy.yaml
```

Or:

```bash
node dist/cli.js \
  --target http://localhost:3000 \
  --port 8080 \
  --latency 800 \
  --jitter 150 \
  --error-rate 0.20
```

Point the client at:

```text
http://localhost:8080
```

## Example config

```yaml
target: http://localhost:3000
host: 127.0.0.1
port: 8080
latencyMs: 800
jitterMs: 150
errorRate: 0.20
errorStatus: 503
timeoutRate: 0.05
timeoutMs: 3000
rateLimit:
  requests: 10
  windowMs: 1000
```

## Fault model

```text
client
  |
  v
chaos-proxy
  +-- rate limit -------> 429
  +-- random error -----> configured 4xx/5xx
  +-- timeout ----------> 504 after delay
  +-- latency + jitter
  v
upstream API
```

## Statistics

Runtime statistics are available by default at:

```text
/__chaos/stats
```

They include request count, forwarded count, injected errors/timeouts, rate-limited requests, upstream errors, transferred bytes and average latency.

## CLI

```text
-c, --config <file>
-t, --target <url>
-p, --port <number>
--host <host>
--latency <ms>
--jitter <ms>
--error-rate <rate>
--error-status <status>
--timeout-rate <rate>
--timeout <ms>
```

CLI flags override config-file values.

## Use cases

Test loading states:

```yaml
latencyMs: 2500
```

Test retry logic:

```yaml
errorRate: 0.35
errorStatus: 503
```

Test timeout handling:

```yaml
timeoutRate: 0.5
timeoutMs: 5000
```

Test rate-limit handling:

```yaml
rateLimit:
  requests: 3
  windowMs: 1000
```

## Project structure

```text
chaos-proxy/
├── src/
│   ├── cli.ts
│   ├── config.ts
│   ├── proxy.ts
│   ├── rate-limiter.ts
│   ├── stats.ts
│   └── types.ts
├── tests/
├── examples/
├── package.json
├── tsconfig.json
└── README.md
```

## Scope

This is a local development and controlled-test tool, not a production replacement for Nginx, Envoy or HAProxy. Request bodies are buffered in memory and capped by `maxBodyBytes`.

## License

MIT
