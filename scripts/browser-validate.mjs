import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { writeFile, mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { basename, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("../", import.meta.url)));
const browserPath =
  process.env.BROWSER_PATH ??
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const pageUrl = process.env.PAGE_URL ?? "http://127.0.0.1:4173/";
const screenshotPath = resolve(projectRoot, "evidence", "browser-success.png");
const fixturePath = resolve(projectRoot, "fixtures", "quality-oracle.csv");
const invalidFixturePath = resolve(projectRoot, "fixtures", "invalid-unclosed.csv");
const tempRoot = resolve(tmpdir());
const profilePath = await mkdtemp(join(tempRoot, "dqc-edge-"));

if (dirname(profilePath) !== tempRoot || !basename(profilePath).startsWith("dqc-edge-")) {
  throw new Error(`Unexpected browser profile path: ${profilePath}`);
}

const oversizedFixturePath = resolve(profilePath, "oversized.csv");
await writeFile(oversizedFixturePath, Buffer.alloc(5 * 1024 * 1024 + 1, 65));

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

async function reservePort() {
  const server = createServer();
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Unable to reserve a browser debugging port.");
  }
  await new Promise((resolveClose, reject) =>
    server.close((error) => (error ? reject(error) : resolveClose())),
  );
  return address.port;
}

async function waitForJson(url, attempts = 100) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      lastError = error;
    }
    await delay(100);
  }
  throw new Error(`Browser debugging endpoint did not become ready: ${String(lastError)}`);
}

class CdpClient {
  #nextId = 1;
  #pending = new Map();
  #listeners = new Map();

  constructor(url) {
    this.socket = new WebSocket(url);
  }

  async open() {
    await new Promise((resolveOpen, reject) => {
      this.socket.addEventListener("open", resolveOpen, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id !== undefined) {
        const pending = this.#pending.get(message.id);
        if (pending === undefined) {
          return;
        }
        this.#pending.delete(message.id);
        if (message.error === undefined) {
          pending.resolve(message.result ?? {});
        } else {
          pending.reject(new Error(JSON.stringify(message.error)));
        }
        return;
      }
      for (const listener of this.#listeners.get(message.method) ?? []) {
        listener(message.params ?? {});
      }
    });
  }

  on(method, listener) {
    const listeners = this.#listeners.get(method) ?? [];
    listeners.push(listener);
    this.#listeners.set(method, listeners);
  }

  send(method, params = {}) {
    const id = this.#nextId;
    this.#nextId += 1;
    return new Promise((resolveCommand, reject) => {
      this.#pending.set(id, { resolve: resolveCommand, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

async function waitForExpression(client, expression, timeoutMilliseconds = 5000) {
  const deadline = Date.now() + timeoutMilliseconds;
  while (Date.now() < deadline) {
    const result = await client.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
    });
    if (result.result?.value) {
      return;
    }
    await delay(50);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

async function evaluateValue(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
  });
  if (result.exceptionDetails !== undefined) {
    throw new Error(JSON.stringify(result.exceptionDetails));
  }
  return result.result?.value;
}

async function selectFile(client, filePath) {
  const documentNode = await client.send("DOM.getDocument");
  const inputNode = await client.send("DOM.querySelector", {
    nodeId: documentNode.root.nodeId,
    selector: "#csv-file",
  });
  assert.notEqual(inputNode.nodeId, 0, "CSV file input must exist");
  await client.send("DOM.setFileInputFiles", {
    nodeId: inputNode.nodeId,
    files: [filePath],
  });
}

const debugPort = await reservePort();
const browser = spawn(
  browserPath,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${profilePath}`,
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"], windowsHide: true },
);

let client;

try {
  await waitForJson(`http://127.0.0.1:${debugPort}/json/version`);
  const target = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, {
    method: "PUT",
  }).then((response) => response.json());
  client = new CdpClient(target.webSocketDebuggerUrl);
  await client.open();

  const requests = [];
  const browserErrors = [];
  client.on("Network.requestWillBeSent", ({ request }) => {
    requests.push({
      method: request.method,
      url: request.url,
      hasPostData: request.postData !== undefined,
      postData: request.postData,
    });
  });
  client.on("Runtime.exceptionThrown", ({ exceptionDetails }) => {
    browserErrors.push(exceptionDetails.text ?? "Runtime exception");
  });
  client.on("Log.entryAdded", ({ entry }) => {
    if (entry.level === "error") {
      browserErrors.push(entry.text);
    }
  });

  await Promise.all([
    client.send("Page.enable"),
    client.send("DOM.enable"),
    client.send("Runtime.enable"),
    client.send("Network.enable"),
    client.send("Log.enable"),
  ]);
  await client.send("Page.navigate", { url: pageUrl });
  await waitForExpression(
    client,
    'document.readyState === "complete" && document.documentElement.dataset.appReady === "true"',
  );

  const initialState = await evaluateValue(
    client,
    '({ heading: document.querySelector("#status-heading")?.textContent, reportHidden: document.querySelector("#report")?.hidden })',
  );
  assert.deepEqual(initialState, { heading: "Ready", reportHidden: true });

  const requestCountBeforeFile = requests.length;
  await selectFile(client, fixturePath);
  await waitForExpression(
    client,
    'document.querySelector("#status-heading")?.textContent === "Check complete"',
  );

  const successState = await evaluateValue(
    client,
    `({
      heading: document.querySelector("#status-heading")?.textContent,
      message: document.querySelector("#status-message")?.textContent,
      totalRows: document.querySelector("#total-rows")?.textContent,
      issueCount: document.querySelector("#issue-count")?.textContent,
      affectedRows: document.querySelector("#affected-rows")?.textContent,
      missing: [...document.querySelectorAll("#missing-body tr")].map((row) =>
        [...row.cells].map((cell) => cell.textContent)
      ),
      duplicates: [...document.querySelectorAll("#duplicate-body tr")].map((row) =>
        [...row.cells].map((cell) => cell.textContent)
      ),
      fileName: document.querySelector("#report-file")?.textContent,
      reportHidden: document.querySelector("#report")?.hidden
    })`,
  );
  assert.deepEqual(successState, {
    heading: "Check complete",
    message: "Found 4 issues across 3 affected rows.",
    totalRows: "5",
    issueCount: "4",
    affectedRows: "3",
    missing: [
      ["2", "3", "name"],
      ["3", "4", "name"],
      ["4", "5", "email"],
    ],
    duplicates: [["2, 3", "3, 4"]],
    fileName: "quality-oracle.csv",
    reportHidden: false,
  });

  const screenshot = await client.send("Page.captureScreenshot", {
    captureBeyondViewport: true,
    format: "png",
    fromSurface: true,
  });
  await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));

  const fileOperationRequests = requests.slice(requestCountBeforeFile);
  assert.equal(fileOperationRequests.length, 0, "Checking a local file must make no requests");

  await selectFile(client, oversizedFixturePath);
  await waitForExpression(
    client,
    'document.querySelector("#status-heading")?.textContent === "File is outside this project’s range"',
  );
  const oversizedState = await evaluateValue(
    client,
    '({ message: document.querySelector("#status-message")?.textContent, reportHidden: document.querySelector("#report")?.hidden })',
  );
  assert.deepEqual(oversizedState, {
    message: "Choose a CSV no larger than 5 MiB. No file content was read.",
    reportHidden: true,
  });

  await selectFile(client, invalidFixturePath);
  await waitForExpression(
    client,
    'document.querySelector("#status-heading")?.textContent === "Unable to check this file"',
  );
  const errorState = await evaluateValue(
    client,
    '({ message: document.querySelector("#status-message")?.textContent, reportHidden: document.querySelector("#report")?.hidden })',
  );
  assert.deepEqual(errorState, {
    message: "A quoted field is not closed. Check source line 2.",
    reportHidden: true,
  });

  await selectFile(client, fixturePath);
  await waitForExpression(
    client,
    'document.querySelector("#status-heading")?.textContent === "Check complete"',
  );
  const replacementState = await evaluateValue(
    client,
    '({ issueCount: document.querySelector("#issue-count")?.textContent, fileName: document.querySelector("#report-file")?.textContent })',
  );
  assert.deepEqual(replacementState, {
    issueCount: "4",
    fileName: "quality-oracle.csv",
  });

  await client.send("Page.reload", { ignoreCache: true });
  await waitForExpression(
    client,
    'document.readyState === "complete" && document.documentElement.dataset.appReady === "true"',
  );
  const refreshedState = await evaluateValue(
    client,
    '({ heading: document.querySelector("#status-heading")?.textContent, reportHidden: document.querySelector("#report")?.hidden })',
  );
  assert.deepEqual(refreshedState, { heading: "Ready", reportHidden: true });
  assert.deepEqual(browserErrors, []);

  const requestSummary = requests.map(({ method, url, hasPostData }) => ({
    method,
    url,
    hasPostData,
  }));
  assert.ok(requests.every((request) => request.method === "GET"));
  assert.ok(requests.every((request) => request.hasPostData === false));
  assert.ok(
    requests.every((request) => !JSON.stringify(request).includes("alice@example.test")),
  );

  console.log(
    JSON.stringify(
      {
        browser: "Microsoft Edge (installed)",
        initialState,
        successState,
        oversizedState,
        errorState,
        replacementState,
        refreshedState,
        fileOperationRequestCount: fileOperationRequests.length,
        browserErrors,
        requests: requestSummary,
        screenshot: screenshotPath,
      },
      null,
      2,
    ),
  );
} finally {
  client?.close();
  browser.kill();
  await delay(250);
  await rm(profilePath, { recursive: true, force: true });
}
