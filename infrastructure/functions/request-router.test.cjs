const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const variablesSource = fs.readFileSync(
  path.join(__dirname, "..", "variables.tf"),
  "utf8",
);
const spaDefault = variablesSource.match(
  /variable "spa_paths" \{[\s\S]*?default\s*=\s*\[([\s\S]*?)\]/,
);
assert.ok(spaDefault, "spa_paths must have an explicit default allowlist");
const spaPaths = [...spaDefault[1].matchAll(/"([^"]+)"/g)].map(
  (match) => match[1],
);

const viteConfig = fs.readFileSync(
  path.join(__dirname, "..", "..", "vite.config.js"),
  "utf8",
);
const generatedShells = [
  ...viteConfig.matchAll(/\{ path: '([^']+)'/g),
].map((match) => `/${match[1]}`);
assert.deepEqual(
  [...spaPaths].sort(),
  [...generatedShells].sort(),
  "CloudFront's SPA allowlist must exactly match the generated route shells",
);

const template = fs.readFileSync(
  path.join(__dirname, "request-router.js.tftpl"),
  "utf8",
);
const source = template
  .replace("${canonical_host}", "codehawks.org")
  .replace("${spa_paths_json}", JSON.stringify(spaPaths));
const context = {};
vm.createContext(context);
vm.runInContext(source, context);

function event(uri, host = "codehawks.org", querystring = {}) {
  return {
    request: {
      headers: { host: { value: host } },
      method: "GET",
      querystring,
      uri,
    },
  };
}

for (const route of spaPaths) {
  assert.equal(context.handler(event(route)).uri, `${route}/index.html`);
  assert.equal(context.handler(event(`${route}/`)).uri, `${route}/index.html`);
}

assert.equal(context.handler(event("/")).uri, "/");
assert.equal(context.handler(event("/unknown")).uri, "/unknown");
assert.equal(
  context.handler(event("/assets/unknown.js")).uri,
  "/assets/unknown.js",
);

const redirect = context.handler(
  event("/privacy", "WWW.CODEHAWKS.ORG", {
    source: { value: "newsletter" },
    tag: { multiValue: [{ value: "one" }, { value: "two" }] },
  }),
);
assert.equal(redirect.statusCode, 301);
assert.equal(
  redirect.headers.location.value,
  "https://codehawks.org/privacy?source=newsletter&tag=one&tag=two",
);
assert.equal(
  redirect.headers["strict-transport-security"].value,
  "max-age=31536000; includeSubDomains",
);

console.log("CloudFront request router tests passed.");
