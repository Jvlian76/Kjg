// Veröffentlicht public/ als Direct-Upload im Cloudflare-Pages-Projekt.
// Aufruf: node scripts/deploy-pages.mjs public kjg-rebland  (vorher: npx cf auth login)
// Das Upload-Token wird über `cf` geholt und nie ausgegeben.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

const [, , root, project] = process.argv;
const require = createRequire(join(process.cwd(), "package.json"));
const { hash } = require("blake3-wasm");

const TYPES = { html: "text/html", css: "text/css", js: "application/javascript", png: "image/png", jpg: "image/jpeg", webp: "image/webp", woff2: "font/woff2", pdf: "application/pdf", xml: "application/xml", txt: "text/plain", svg: "image/svg+xml" };
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (!["_headers", "_redirects"].includes(name)) files.push(p);
  }
})(root);

const entries = files.map((p) => {
  const ext = extname(p).slice(1);
  const b64 = readFileSync(p).toString("base64");
  return { path: "/" + relative(root, p), hash: hash(b64 + ext).toString("hex").slice(0, 32), b64, type: TYPES[ext] || "application/octet-stream" };
});

const out = JSON.parse(execFileSync("cf", ["pages", "projects", "get-upload-token", project], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }));
const jwt = out.jwt;
if (!jwt) throw new Error("Kein Upload-Token erhalten");
const api = async (path, body) => {
  const r = await fetch("https://api.cloudflare.com/client/v4/pages/assets/" + path, { method: "POST", headers: { Authorization: "Bearer " + jwt, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!j.success) throw new Error(path + ": " + JSON.stringify(j.errors));
  return j.result;
};

const missing = new Set(await api("check-missing", { hashes: entries.map((e) => e.hash) }));
const todo = entries.filter((e) => missing.has(e.hash));
for (let i = 0; i < todo.length; i += 10) {
  await api("upload", todo.slice(i, i + 10).map((e) => ({ key: e.hash, value: e.b64, metadata: { contentType: e.type }, base64: true })));
}
await api("upsert-hashes", { hashes: entries.map((e) => e.hash) });

const manifest = JSON.stringify(Object.fromEntries(entries.map((e) => [e.path, e.hash])));
const commit = (args) => { try { return execFileSync("git", args, { encoding: "utf8" }).trim(); } catch { return ""; } };
const deployment = JSON.parse(execFileSync("cf", ["pages", "projects", "deployments", "create", project, "--branch", "main",
  "--commit-hash", commit(["rev-parse", "HEAD"]), "--commit-message", commit(["log", "-1", "--pretty=%s"]) || "Deploy",
  "--manifest", manifest], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }));
console.log(`Dateien: ${entries.length}, neu hochgeladen: ${todo.length}`);
console.log(`Veröffentlicht: https://${project}.pages.dev (Deployment ${deployment.url})`);
