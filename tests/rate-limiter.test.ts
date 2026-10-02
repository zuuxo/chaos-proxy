import test from "node:test";import assert from "node:assert/strict";import { FixedWindowRateLimiter } from "../src/rate-limiter.js";
test("limits inside a window",()=>{const l=new FixedWindowRateLimiter({requests:2,windowMs:1000});assert.equal(l.allow("x",0),true);assert.equal(l.allow("x",100),true);assert.equal(l.allow("x",200),false);assert.equal(l.allow("x",1000),true);});
