import http,{type IncomingHttpHeaders,type IncomingMessage,type ServerResponse} from "node:http";
import https from "node:https";
import { pipeline } from "node:stream/promises";
import { FixedWindowRateLimiter } from "./rate-limiter.js";
import { createStats,publicStats } from "./stats.js";
import type { ChaosConfig,ProxyStats } from "./types.js";

export interface ChaosProxy{server:http.Server;stats:ProxyStats;close():Promise<void>}
export function createChaosProxy(config:ChaosConfig):ChaosProxy{
 const stats=createStats(),target=new URL(config.target),limiter=config.rateLimit?new FixedWindowRateLimiter(config.rateLimit):null;
 const server=http.createServer(async(req,res)=>{
  stats.requests++;
  if((req.url??"/")===config.statsPath){json(res,200,publicStats(stats));return;}
  const key=req.socket.remoteAddress??"unknown";
  if(limiter&&!limiter.allow(key)){stats.rateLimited++;json(res,429,{error:"chaos_proxy_rate_limit"});return;}
  if(chance(config.errorRate)){stats.injectedErrors++;await sleep(jitter(config.latencyMs,config.jitterMs));json(res,config.errorStatus,{error:"chaos_proxy_injected_error",status:config.errorStatus});return;}
  if(chance(config.timeoutRate)){stats.injectedTimeouts++;await sleep(config.timeoutMs+jitter(config.latencyMs,config.jitterMs));json(res,504,{error:"chaos_proxy_timeout",message:`Simulated timeout after ${config.timeoutMs}ms.`});return;}
  try{const added=jitter(config.latencyMs,config.jitterMs);await sleep(added);const started=performance.now();await forward(req,res,target,config,stats);stats.totalLatencyMs+=performance.now()-started+added;stats.forwarded++;}
  catch(e){stats.upstreamErrors++;if(!res.headersSent)json(res,502,{error:"chaos_proxy_upstream_error",message:e instanceof Error?e.message:"unknown"});else res.destroy();}
 });
 return{server,stats,close:()=>new Promise((resolve,reject)=>server.close(e=>e?reject(e):resolve()))};
}
async function forward(req:IncomingMessage,res:ServerResponse,target:URL,config:ChaosConfig,stats:ProxyStats){
 const body=await readBody(req,config.maxBodyBytes);stats.bytesIn+=body.byteLength;const url=new URL(req.url??"/",target);const transport=url.protocol==="https:"?https:http;
 const headers:IncomingHttpHeaders={...req.headers,host:url.host,"x-chaos-proxy":"1"};delete headers["content-length"];headers["content-length"]=String(body.byteLength);
 await new Promise<void>((resolve,reject)=>{const up=transport.request(url,{method:req.method,headers},async ur=>{try{const h={...ur.headers};delete h["transfer-encoding"];res.writeHead(ur.statusCode??502,ur.statusMessage,h);let bytes=0;ur.on("data",(c:Buffer)=>bytes+=c.byteLength);await pipeline(ur,res);stats.bytesOut+=bytes;resolve();}catch(e){reject(e);}});up.on("error",reject);if(body.length)up.write(body);up.end();});
}
async function readBody(req:IncomingMessage,max:number){const chunks:Buffer[]=[];let total=0;for await(const chunk of req){const b=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);total+=b.length;if(total>max)throw new Error(`Request body exceeds ${max} bytes`);chunks.push(b);}return Buffer.concat(chunks);}
const chance=(r:number)=>r>0&&Math.random()<r;const jitter=(l:number,j:number)=>Math.max(0,l+(j?((Math.random()*2-1)*j):0));const sleep=(ms:number)=>ms>0?new Promise<void>(r=>setTimeout(r,ms)):Promise.resolve();
function json(res:ServerResponse,status:number,payload:unknown){const body=JSON.stringify(payload,null,2);res.writeHead(status,{"content-type":"application/json; charset=utf-8","content-length":Buffer.byteLength(body),"cache-control":"no-store"});res.end(body);}
