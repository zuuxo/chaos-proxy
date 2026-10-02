import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import YAML from "yaml";
import type { ChaosConfig } from "./types.js";

export const DEFAULT_CONFIG:ChaosConfig={target:"http://localhost:3000",port:8080,host:"127.0.0.1",latencyMs:0,jitterMs:0,errorRate:0,errorStatus:503,timeoutRate:0,timeoutMs:3000,rateLimit:null,maxBodyBytes:2*1024*1024,statsPath:"/__chaos/stats"};

export async function loadConfig(file:string|undefined,overrides:Partial<ChaosConfig>):Promise<ChaosConfig>{
 let fromFile:Partial<ChaosConfig>={};
 if(file){const raw=await readFile(file,"utf8");fromFile=extname(file).toLowerCase()===".json"?JSON.parse(raw):YAML.parse(raw);}
 const clean=Object.fromEntries(Object.entries(overrides).filter(([,v])=>v!==undefined)) as Partial<ChaosConfig>;
 const config={...DEFAULT_CONFIG,...fromFile,...clean};validateConfig(config);return config;
}
export function validateConfig(c:ChaosConfig):void{
 const u=new URL(c.target); if(!["http:","https:"].includes(u.protocol))throw new Error("target must use http:// or https://");
 if(!Number.isInteger(c.port)||c.port<1||c.port>65535)throw new Error("port must be between 1 and 65535");
 for(const [n,v] of [["latencyMs",c.latencyMs],["jitterMs",c.jitterMs],["timeoutMs",c.timeoutMs],["maxBodyBytes",c.maxBodyBytes]] as const){if(!Number.isFinite(v)||v<0)throw new Error(`${n} must be >= 0`);}
 for(const [n,v] of [["errorRate",c.errorRate],["timeoutRate",c.timeoutRate]] as const){if(v<0||v>1)throw new Error(`${n} must be between 0 and 1`);}
 if(!Number.isInteger(c.errorStatus)||c.errorStatus<400||c.errorStatus>599)throw new Error("errorStatus must be 400..599");
 if(c.rateLimit&&(!Number.isInteger(c.rateLimit.requests)||c.rateLimit.requests<1||c.rateLimit.windowMs<1))throw new Error("invalid rateLimit");
 if(!c.statsPath.startsWith("/"))throw new Error("statsPath must start with /");
}
