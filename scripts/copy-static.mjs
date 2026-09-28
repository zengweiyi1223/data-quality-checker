import { copyFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("../", import.meta.url)));
const staticRoot = resolve(projectRoot, "static");
const distRoot = resolve(projectRoot, "dist");
const approvedFiles = ["favicon.svg", "index.html", "styles.css"];

await mkdir(distRoot, { recursive: true });

for (const fileName of approvedFiles) {
  await copyFile(resolve(staticRoot, fileName), resolve(distRoot, fileName));
}
