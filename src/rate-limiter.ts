import type { RateLimitConfig } from "./types.js";
interface Bucket{windowStartedAt:number;count:number}
export class FixedWindowRateLimiter{private buckets=new Map<string,Bucket>();constructor(private config:RateLimitConfig){} allow(key:string,now=Date.now()):boolean{const b=this.buckets.get(key);if(!b||now-b.windowStartedAt>=this.config.windowMs){this.buckets.set(key,{windowStartedAt:now,count:1});return true;}if(b.count>=this.config.requests)return false;b.count++;return true;} reset(){this.buckets.clear();}}
