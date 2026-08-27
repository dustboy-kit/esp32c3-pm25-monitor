const METHODS = Object.freeze({
  "rpc.discover": "List the JSON-RPC methods implemented by this browser adapter.",
  "device.info": "Read alias, IP address, MAC address, and ESPHome version.",
  "telemetry.snapshot": "Read PM values and device diagnostics in one result.",
  "entity.get": "Read one ESPHome Web API entity.",
  "alias.set": "Persist the mutable Device Alias text entity.",
  "button.press": "Press a named ESPHome button entity.",
  "device.restart": "Press the Restart button entity.",
});

const SNAPSHOT_ENTITIES = Object.freeze({
  pm1: ["sensor", "PM1.0"],
  pm25: ["sensor", "PM2.5"],
  pm10: ["sensor", "PM10"],
  airQuality: ["text_sensor", "Air Quality Level"],
  wifiRssi: ["sensor", "Wi-Fi RSSI"],
  uptime: ["sensor", "Uptime"],
  alias: ["text", "Device Alias"],
  ip: ["text_sensor", "IP Address"],
  mac: ["text_sensor", "MAC Address"],
  version: ["text_sensor", "ESPHome Version"],
});

class RpcFault extends Error {
  constructor(code, message, data) {
    super(message);
    this.name = "RpcFault";
    this.code = code;
    this.data = data;
  }
}

export function normalizeDeviceUrl(value) {
  let url = String(value || "").trim();
  if (!url) throw new RpcFault(-32602, "Device hostname or IP address is required");
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new RpcFault(-32602, "Invalid device hostname or URL", { value });
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    throw new RpcFault(-32602, "Only http:// and https:// device URLs are supported");
  }
  parsed.pathname = "/";
  parsed.search = "";
  parsed.hash = "";
  return parsed.href.replace(/\/$/, "");
}

function entityPath(domain, name, action = "") {
  const validDomains = new Set(["sensor", "text_sensor", "text", "button", "binary_sensor", "switch"]);
  if (!validDomains.has(domain)) {
    throw new RpcFault(-32602, `Unsupported ESPHome domain: ${domain}`);
  }
  if (!String(name || "").trim()) throw new RpcFault(-32602, "Entity name is required");
  const segments = [domain, encodeURIComponent(String(name))];
  if (action) segments.push(action);
  return `/${segments.join("/")}`;
}

export class DbkEspHomeRpc {
  constructor(deviceUrl, options = {}) {
    this.baseUrl = normalizeDeviceUrl(deviceUrl);
    this.timeoutMs = Number(options.timeoutMs || 5000);
    this.fetch = options.fetch || (typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : null);
    if (typeof this.fetch !== "function") throw new Error("fetch is unavailable");
  }

  async fetchJson(path, init = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetch(`${this.baseUrl}${path}`, {
        cache: "no-store",
        mode: "cors",
        ...init,
        signal: controller.signal,
      });
      const body = await response.text();
      if (!response.ok) {
        throw new RpcFault(-32004, `ESPHome returned HTTP ${response.status}`, { path, body });
      }
      if (!body) return { ok: true };
      try {
        return JSON.parse(body);
      } catch {
        throw new RpcFault(-32003, "ESPHome returned non-JSON data", { path, body: body.slice(0, 240) });
      }
    } catch (error) {
      if (error instanceof RpcFault) throw error;
      const timedOut = error && error.name === "AbortError";
      throw new RpcFault(
        timedOut ? -32001 : -32000,
        timedOut ? "Device request timed out" : "Could not reach the ESPHome Web API",
        { deviceUrl: this.baseUrl, cause: String(error && error.message ? error.message : error) },
      );
    } finally {
      clearTimeout(timer);
    }
  }

  getEntity(domain, name) {
    return this.fetchJson(`${entityPath(domain, name)}?detail=all`);
  }

  async readEntitySet(entries) {
    const pairs = await Promise.all(Object.entries(entries).map(async ([key, [domain, name]]) => {
      try {
        return [key, await this.getEntity(domain, name), null];
      } catch (error) {
        return [key, null, { code: error.code || -32000, message: error.message }];
      }
    }));
    const entities = {};
    const unavailable = {};
    for (const [key, value, error] of pairs) {
      if (error) unavailable[key] = error;
      else entities[key] = value;
    }
    return { entities, unavailable };
  }

  async invoke(method, params = {}) {
    switch (method) {
      case "rpc.discover":
        return { adapter: "dustboy.esphome-web-api", version: 1, deviceUrl: this.baseUrl, methods: METHODS };
      case "device.info": {
        const result = await this.readEntitySet({
          alias: SNAPSHOT_ENTITIES.alias,
          ip: SNAPSHOT_ENTITIES.ip,
          mac: SNAPSHOT_ENTITIES.mac,
          version: SNAPSHOT_ENTITIES.version,
        });
        return { deviceUrl: this.baseUrl, ...result };
      }
      case "telemetry.snapshot": {
        const result = await this.readEntitySet(SNAPSHOT_ENTITIES);
        return { deviceUrl: this.baseUrl, sampledAt: new Date().toISOString(), ...result };
      }
      case "entity.get":
        return this.getEntity(params.domain, params.name);
      case "alias.set": {
        const value = String(params.value || "").trim();
        if (!value || value.length > 32) {
          throw new RpcFault(-32602, "Alias must contain 1 to 32 characters");
        }
        const query = new URLSearchParams({ value });
        await this.fetchJson(`${entityPath("text", "Device Alias", "set")}?${query}`, { method: "POST" });
        return { alias: value, persisted: true };
      }
      case "button.press": {
        const name = String(params.name || "").trim();
        if (!name) throw new RpcFault(-32602, "Button name is required");
        await this.fetchJson(entityPath("button", name, "press"), { method: "POST" });
        return { pressed: name };
      }
      case "device.restart":
        await this.fetchJson(entityPath("button", "Restart", "press"), { method: "POST" });
        return { restarting: true };
      default:
        throw new RpcFault(-32601, `Method not found: ${method}`);
    }
  }

  async request(request) {
    const id = request && Object.prototype.hasOwnProperty.call(request, "id") ? request.id : null;
    if (!request || request.jsonrpc !== "2.0" || typeof request.method !== "string") {
      return { jsonrpc: "2.0", id, error: { code: -32600, message: "Invalid JSON-RPC 2.0 request" } };
    }
    try {
      return { jsonrpc: "2.0", id, result: await this.invoke(request.method, request.params || {}) };
    } catch (error) {
      return {
        jsonrpc: "2.0",
        id,
        error: {
          code: Number.isInteger(error.code) ? error.code : -32603,
          message: error.message || "Internal error",
          ...(error.data === undefined ? {} : { data: error.data }),
        },
      };
    }
  }
}

export const telemetryEntities = SNAPSHOT_ENTITIES;
