import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../site/tools/dbk-esphome-rpc.js", import.meta.url), "utf8");
const dashboard = await readFile(new URL("../site/dashboard/index.html", import.meta.url), "utf8");
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
const { DbkEspHomeRpc, normalizeDeviceUrl } = await import(moduleUrl);

assert.equal(normalizeDeviceUrl("dbk-a1b2c3.local"), "http://dbk-a1b2c3.local");
assert.equal(normalizeDeviceUrl("http://192.168.1.42/path?q=1"), "http://192.168.1.42");
assert.doesNotMatch(dashboard, /EventSource|\/events/);
assert.match(dashboard, /setInterval\(.*5000\)/);

const calls = [];
const fakeFetch = async (url, init) => {
  calls.push({ url, method: init.method || "GET" });
  const path = new URL(url).pathname;
  if (path.startsWith("/text/Device%20Alias/set")) {
    return new Response("", { status: 200 });
  }
  if (path === "/button/Restart/press") return new Response("", { status: 200 });
  const name = decodeURIComponent(path.split("/").pop());
  const values = {
    "PM1.0": 7,
    "PM2.5": 42,
    PM10: 100,
    "Air Quality Level": "FAIR",
    "Wi-Fi RSSI": -57,
    Uptime: 3600,
    "Device Alias": "DBK A1B2C3",
    "IP Address": "192.168.1.42",
    "MAC Address": "AA:BB:CC:A1:B2:C3",
    "ESPHome Version": "2026.6.5",
  };
  return Response.json({ id: name.toLowerCase().replaceAll(" ", "_"), state: String(values[name]), value: values[name] });
};

const rpc = new DbkEspHomeRpc("dbk-a1b2c3.local", { fetch: fakeFetch, timeoutMs: 100 });
const snapshot = await rpc.request({ jsonrpc: "2.0", id: 1, method: "telemetry.snapshot", params: {} });
assert.equal(snapshot.jsonrpc, "2.0");
assert.equal(snapshot.result.entities.pm25.value, 42);
assert.equal(snapshot.result.entities.alias.value, "DBK A1B2C3");
assert.deepEqual(snapshot.result.unavailable, {});

const alias = await rpc.request({ jsonrpc: "2.0", id: 2, method: "alias.set", params: { value: "DBK LAB 2" } });
assert.deepEqual(alias.result, { alias: "DBK LAB 2", persisted: true });
assert.match(calls.at(-1).url, /\/text\/Device%20Alias\/set\?value=DBK\+LAB\+2$/);
assert.equal(calls.at(-1).method, "POST");

const restart = await rpc.request({ jsonrpc: "2.0", id: 3, method: "device.restart" });
assert.equal(restart.result.restarting, true);
assert.equal(calls.at(-1).method, "POST");

const unknown = await rpc.request({ jsonrpc: "2.0", id: 4, method: "missing.method" });
assert.equal(unknown.error.code, -32601);
const invalid = await rpc.request({ method: "telemetry.snapshot" });
assert.equal(invalid.error.code, -32600);

console.log("dbk-esphome-rpc: all tests passed");
