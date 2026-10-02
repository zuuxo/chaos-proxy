import type { ProxyStats } from "./types.js";
export function createStats():ProxyStats{return{startedAt:new Date().toISOString(),requests:0,forwarded:0,injectedErrors:0,injectedTimeouts:0,rateLimited:0,upstreamErrors:0,bytesIn:0,bytesOut:0,totalLatencyMs:0};}
export function publicStats(s:ProxyStats){return{...s,averageLatencyMs:s.forwarded?Math.round((s.totalLatencyMs/s.forwarded)*100)/100:0};}
