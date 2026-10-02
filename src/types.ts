export interface RateLimitConfig { requests:number; windowMs:number; }
export interface ChaosConfig { target:string; port:number; host:string; latencyMs:number; jitterMs:number; errorRate:number; errorStatus:number; timeoutRate:number; timeoutMs:number; rateLimit:RateLimitConfig|null; maxBodyBytes:number; statsPath:string; }
export interface ProxyStats { startedAt:string; requests:number; forwarded:number; injectedErrors:number; injectedTimeouts:number; rateLimited:number; upstreamErrors:number; bytesIn:number; bytesOut:number; totalLatencyMs:number; }
