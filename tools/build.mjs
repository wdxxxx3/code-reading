#!/usr/bin/env node
// 把 problems/ 里的每道题加密成 docs/p/<编号>.json，并把每题的链接写进 links.md。
//
//   node tools/build.mjs
//
// 同一个文件再跑一次，编号和密钥不变，链接不变，只更新内容。
// problems/ 删掉的题，对应的加密文件也会删掉，旧链接随之失效。
//
// links.json 里存着每题的密钥，links.md 里是完整链接：这两个文件和 problems/ 都不要提交到 GitHub。

import { webcrypto as crypto } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PROBLEMS = path.join(ROOT, "problems");
const OUT = path.join(ROOT, "docs", "p");
const LINKS_JSON = path.join(ROOT, "links.json");
const LINKS_MD = path.join(ROOT, "links.md");
const CONFIG = path.join(ROOT, "site.json");

const LANG_BY_EXT = {
  ".py": "python", ".js": "javascript", ".mjs": "javascript", ".ts": "typescript",
  ".go": "go", ".java": "java", ".kt": "kotlin", ".c": "c", ".h": "c",
  ".cc": "cpp", ".cpp": "cpp", ".hpp": "cpp", ".rs": "rust", ".swift": "swift",
  ".rb": "ruby", ".php": "php", ".cs": "csharp", ".sql": "sql", ".sh": "bash",
  ".lua": "lua", ".scala": "scala",
};

const b64url = (bytes) => Buffer.from(bytes).toString("base64url");
const readJson = (p, fallback) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fallback);

const config = readJson(CONFIG, {});
let baseUrl = process.env.BASE_URL || config.baseUrl || "http://localhost:8000/";
if (!baseUrl.endsWith("/")) baseUrl += "/";

fs.mkdirSync(OUT, { recursive: true });
const links = readJson(LINKS_JSON, {}); // 文件名 -> { id, key }

const files = fs.existsSync(PROBLEMS)
  ? fs.readdirSync(PROBLEMS).filter((f) => !f.startsWith(".") && fs.statSync(path.join(PROBLEMS, f)).isFile()).sort()
  : [];

if (!files.length) {
  console.log("problems/ 里还没有题目。");
}

for (const name of files) {
  let entry = links[name];
  if (!entry) {
    entry = {
      id: b64url(crypto.getRandomValues(new Uint8Array(6))),
      key: b64url(crypto.getRandomValues(new Uint8Array(32))),
    };
    links[name] = entry;
  }
  const code = fs.readFileSync(path.join(PROBLEMS, name), "utf8");
  const lang = LANG_BY_EXT[path.extname(name).toLowerCase()] || "";
  const key = await crypto.subtle.importKey("raw", Buffer.from(entry.key, "base64url"), "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify({ code, lang }));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plain);
  fs.writeFileSync(path.join(OUT, `${entry.id}.json`), JSON.stringify({ v: 1, iv: b64url(iv), ct: b64url(ct) }));
}

// 删掉已经不在 problems/ 里的题
for (const name of Object.keys(links)) {
  if (!files.includes(name)) {
    fs.rmSync(path.join(OUT, `${links[name].id}.json`), { force: true });
    delete links[name];
  }
}
const keep = new Set(Object.values(links).map((e) => `${e.id}.json`));
for (const f of fs.readdirSync(OUT)) {
  if (f.endsWith(".json") && !keep.has(f)) fs.rmSync(path.join(OUT, f));
}

fs.writeFileSync(LINKS_JSON, JSON.stringify(links, null, 2) + "\n");

const rows = files.map((name) => `| ${name} | ${baseUrl}#${links[name].id}.${links[name].key} |`);
fs.writeFileSync(
  LINKS_MD,
  ["# 题目链接", "", "把对应链接贴进飞书题库文档。不要提交这个文件。", "", "| 题目 | 链接 |", "|---|---|", ...rows, ""].join("\n"),
);

for (const name of files) {
  console.log(`${name}\n  ${baseUrl}#${links[name].id}.${links[name].key}\n`);
}
console.log(`共 ${files.length} 题，链接已写入 links.md`);
