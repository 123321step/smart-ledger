import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = resolve(process.cwd());
const distDir = resolve(projectRoot, "dist");
const filesToCopy = [
  "index.html",
  "app.js",
  "styles.css",
  "manifest.webmanifest",
  "service-worker.js"
];

if (existsSync(distDir)) {
  rmSync(distDir, { recursive: true, force: true });
}

mkdirSync(distDir, { recursive: true });

for (const file of filesToCopy) {
  cpSync(resolve(projectRoot, file), resolve(distDir, file), { recursive: true });
}

console.log(`Copied ${filesToCopy.length} files to ${distDir}`);
