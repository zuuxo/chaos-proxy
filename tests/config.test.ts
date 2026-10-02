import test from "node:test";import assert from "node:assert/strict";import { DEFAULT_CONFIG,validateConfig } from "../src/config.js";
test("valid default",()=>assert.doesNotThrow(()=>validateConfig(DEFAULT_CONFIG)));test("bad error rate",()=>assert.throws(()=>validateConfig({...DEFAULT_CONFIG,errorRate:2}),/errorRate/));
