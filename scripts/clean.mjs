import { rm } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("../", import.meta.url)));
const distPath = resolve(projectRoot, "dist");

if (dirname(distPath) !== projectRoot || basename(distPath) !== "dist") {
  throw new Error(`Refusing to clean unexpected path: ${distPath}`);
}

await rm(distPath, { recursive: true, force: true });
