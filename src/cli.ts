#!/usr/bin/env node
import { Command } from "commander";
import { loadConfig } from "./config.js";
import { createChaosProxy } from "./proxy.js";
import type { ChaosConfig } from "./types.js";
const program=new Command();
program.name("chaos-proxy").description("Local reverse proxy with configurable fault injection").version("0.1.0")
.option("-c, --config <file>","YAML or JSON config")
.option("-t, --target <url>","Upstream target URL")
.option("-p, --port <number>","Local port",v=>Number.parseInt(v,10))
.option("--host <host>","Listen host")
.option("--latency <ms>","Base latency",Number)
.option("--jitter <ms>","Latency jitter +/- ms",Number)
.option("--error-rate <rate>","Error probability 0..1",Number)
.option("--error-status <status>","Injected error status",v=>Number.parseInt(v,10))
.option("--timeout-rate <rate>","Timeout probability 0..1",Number)
.option("--timeout <ms>","Timeout duration",Number)
.action(async o=>{try{const c=await loadConfig(o.config,{target:o.target,port:o.port,host:o.host,latencyMs:o.latency,jitterMs:o.jitter,errorRate:o.errorRate,errorStatus:o.errorStatus,timeoutRate:o.timeoutRate,timeoutMs:o.timeout} as Partial<ChaosConfig>);const p=createChaosProxy(c);p.server.listen(c.port,c.host,()=>{console.log(`chaos-proxy

listening: http://${c.host}:${c.port}
target:    ${c.target}
stats:     http://${c.host}:${c.port}${c.statsPath}

latency:   ${c.latencyMs}ms +/- ${c.jitterMs}ms
errors:    ${(c.errorRate*100).toFixed(1)}% -> ${c.errorStatus}
timeouts:  ${(c.timeoutRate*100).toFixed(1)}% -> ${c.timeoutMs}ms
rate limit: ${c.rateLimit?`${c.rateLimit.requests}/${c.rateLimit.windowMs}ms`:"off"}
`);});const stop=async()=>{await p.close();process.exit(0)};process.once("SIGINT",stop);process.once("SIGTERM",stop);}catch(e){console.error(`chaos-proxy: ${e instanceof Error?e.message:"unknown error"}`);process.exitCode=1;}});
await program.parseAsync(process.argv);
