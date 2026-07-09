
import { readFile } from "node:fs/promises";
import path from "node:path";

export const headers = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type",
  "access-control-allow-methods": "GET,POST,OPTIONS"
};

export function json(statusCode, data) {
  return { statusCode, headers, body: JSON.stringify(data) };
}

export async function readJsonFile(relPath) {
  const p = path.join(process.cwd(), relPath);
  const raw = await readFile(p, "utf8");
  return JSON.parse(raw);
}

export function parseThaiDate(s) {
  const m = String(s || "").match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (!m) return 0;
  let y = Number(m[3]);
  if (y > 2400) y -= 543;
  return new Date(y, Number(m[2]) - 1, Number(m[1])).getTime();
}

export function cleanRow(row, market, sourceUrl = "") {
  const drawDate = String(row.drawDate || row.draw_date || row.date || row["วันที่"] || "").trim();
  const result = String(row.result || row.number || row["ผล"] || "").replace(/\D/g, "");
  if (!drawDate || !result) return null;
  return {
    market,
    drawDate,
    result,
    result4: result.slice(-4),
    n3: String(row.n3 || result.slice(-3)).replace(/\D/g, "").slice(-3),
    n2: String(row.n2 || result.slice(-2)).replace(/\D/g, "").slice(-2),
    source: String(row.source || "manual-netlify"),
    url: String(row.url || sourceUrl || ""),
    syncedAt: new Date().toISOString()
  };
}

export function parseCsv(text, market, sourceUrl = "") {
  const lines = String(text || "").split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  if (!lines.length) return [];
  let start = 0;
  let headersLine = lines[0].toLowerCase();
  let hasHeader = headersLine.includes("draw") || headersLine.includes("date") || headersLine.includes("result") || headersLine.includes("วันที่");
  if (hasHeader) start = 1;
  const out = [];
  for (let i = start; i < lines.length; i++) {
    const parts = lines[i].split(",").map(x => x.trim());
    const row = cleanRow({ draw_date: parts[0], result: parts[1], n3: parts[2], n2: parts[3] }, market, sourceUrl);
    if (row) out.push(row);
  }
  return out;
}

export function mergeRows(existing, incoming, mode = "append") {
  const list = mode === "replace" ? [] : Array.isArray(existing) ? [...existing] : [];
  for (const row of incoming) list.push(row);
  const map = new Map();
  for (const row of list) {
    const key = `${row.drawDate}|${row.result}`;
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => parseThaiDate(b.drawDate) - parseThaiDate(a.drawDate));
}
