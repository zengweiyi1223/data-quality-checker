import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function read(relativePath) {
  return readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

async function listFiles(directoryUrl, prefix = "") {
  const entries = await readdir(directoryUrl, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      files.push(...(await listFiles(new URL(`${entry.name}/`, directoryUrl), relativePath)));
    } else {
      files.push(relativePath);
    }
  }
  return files.sort();
}

test("keeps Core and Adapter dependencies inside their frozen boundaries", async () => {
  const core = await read("src/core/quality.ts");
  const adapter = await read("src/adapters/csv.ts");

  assert.match(core, /from "\.\.\/shared\/types\.js"/);
  assert.doesNotMatch(core, /document|window|fetch|XMLHttpRequest|WebSocket|sendBeacon|File/);
  assert.match(adapter, /from "\.\.\/shared\/types\.js"/);
  assert.doesNotMatch(
    adapter,
    /from "\.\.\/core|QualityReport|document|window|fetch|localStorage|indexedDB/,
  );
});

test("contains no production network or browser persistence API", async () => {
  const productionSource = (
    await Promise.all([
      read("src/core/quality.ts"),
      read("src/adapters/csv.ts"),
      read("src/ui/app.ts"),
    ])
  ).join("\n");

  assert.doesNotMatch(
    productionSource,
    /\bfetch\b|XMLHttpRequest|WebSocket|sendBeacon|localStorage|sessionStorage|indexedDB|caches\.open/,
  );
});

test("locks the static page to local assets and disallows connections", async () => {
  const html = await read("static/index.html");

  assert.match(html, /connect-src 'none'/);
  assert.match(html, /script-src 'self'/);
  assert.match(html, /style-src 'self'/);
  assert.doesNotMatch(html, /<form\b|https?:\/\//i);
  assert.match(html, /src="\.\/assets\/ui\/app\.js"/);
  assert.match(html, /href="\.\/styles\.css"/);
});

test("build output contains only the approved static artifact set", async () => {
  const files = await listFiles(new URL("../dist/", import.meta.url));

  assert.deepEqual(files, [
    "assets/adapters/csv.js",
    "assets/core/quality.js",
    "assets/shared/types.js",
    "assets/ui/app.js",
    "favicon.svg",
    "index.html",
    "styles.css",
  ]);
});

test("keeps the package free of runtime dependencies", async () => {
  const packageJson = JSON.parse(await read("package.json"));

  assert.equal(packageJson.dependencies, undefined);
  assert.deepEqual(Object.keys(packageJson.devDependencies), ["typescript"]);
});
