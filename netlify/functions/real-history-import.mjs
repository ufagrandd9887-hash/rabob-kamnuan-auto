
import { getStore, connectLambda } from "@netlify/blobs";
import { json, headers, readJsonFile, mergeRows } from "./utils.mjs";

function stripTags(s = "") {
  return String(s)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchDecoded(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 NetlifyFunction RealHistoryImporter",
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
    }
  });
  if (!res.ok) throw new Error(`fetch failed ${res.status} ${url}`);
  const buf = await res.arrayBuffer();

  // ThaiORC may use non-UTF8 Thai encoding. Try common Thai encodings first.
  for (const enc of ["windows-874", "tis-620", "utf-8"]) {
    try {
      const text = new TextDecoder(enc).decode(buf);
      if (text && (text.includes("งวดวันที่") || text.includes("<table") || text.includes("เลข"))) return text;
    } catch (_) {}
  }
  return new TextDecoder("utf-8").decode(buf);
}

function extractRowsFromTables(html) {
  const rows = [];
  const trRegex = /<tr[\s\S]*?<\/tr>/gi;
  const tdRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  const trs = html.match(trRegex) || [];
  for (const tr of trs) {
    const cells = [];
    let m;
    tdRegex.lastIndex = 0;
    while ((m = tdRegex.exec(tr))) {
      cells.push(stripTags(m[1]));
    }
    if (cells.length >= 3 && /\d{1,2}\/\d{1,2}\/\d{4}/.test(cells[0])) rows.push(cells);
  }
  return rows;
}

function digitsOnly(v = "") {
  return String(v).replace(/[^\d]/g, "");
}

function cleanDate(v = "") {
  const m = String(v).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return "";
  return `${m[1].padStart(2,"0")}/${m[2].padStart(2,"0")}/${m[3]}`;
}

function rowFromCells(cells, market, type, sourceUrl) {
  const drawDate = cleanDate(cells[0]);
  if (!drawDate) return null;

  let result = "", n3 = "", n2 = "";
  if (type === "thai_gov") {
    // columns: date, first prize, last2, front3, back3
    result = digitsOnly(cells[1]);
    n3 = result.slice(-3);
    n2 = digitsOnly(cells[2] || result.slice(-2)).slice(-2);
  } else if (type === "lao" || type === "baac") {
    // columns: date, 6/5 digit result, 3 top, 2 top, 2 lower
    result = digitsOnly(cells[1]);
    n3 = digitsOnly(cells[2] || result.slice(-3)).slice(-3);
    n2 = digitsOnly(cells[3] || result.slice(-2)).slice(-2);
  } else if (type === "gsb") {
    // columns: date, prize1, prize2, 3 top, 2 lower
    result = digitsOnly(cells[1]);
    n3 = digitsOnly(cells[3] || result.slice(-3)).slice(-3);
    n2 = digitsOnly(cells[4] || result.slice(-2)).slice(-2);
  } else if (type === "hanoi") {
    // columns: date, special, first prize, 3 top, 2 lower
    result = digitsOnly(cells[1] || cells[2]);
    n3 = digitsOnly(cells[3] || result.slice(-3)).slice(-3);
    n2 = digitsOnly(cells[4] || result.slice(-2)).slice(-2);
  }

  if (!result || !n2) return null;
  return {
    market,
    drawDate,
    result,
    result4: result.slice(-4),
    n3,
    n2,
    source: "real-history-scraper",
    url: sourceUrl,
    syncedAt: new Date().toISOString()
  };
}

async function scrapeThaiOrcMarket(market, cfg) {
  const out = [];
  const seen = new Set();
  const base = cfg.urls[0];
  const pages = Math.max(1, Number(cfg.pages || 1));

  for (let pg = 1; pg <= pages; pg++) {
    const url = pg === 1 ? base : `${base}${base.includes("?") ? "&" : "?"}pg=${pg}`;
    let html;
    try {
      html = await fetchDecoded(url);
    } catch (e) {
      if (pg === 1) throw e;
      break;
    }

    const tableRows = extractRowsFromTables(html);
    let addedThisPage = 0;
    for (const cells of tableRows) {
      const row = rowFromCells(cells, market, cfg.type, url);
      if (!row) continue;
      const key = `${row.drawDate}|${row.result}|${row.n2}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(row);
      addedThisPage++;
    }
    if (pg > 1 && addedThisPage === 0) break;
  }

  return out;
}

async function saveMarketRows(market, incoming, mode = "replace") {
  const store = getStore("lottery-results");
  const key = `market-${market}`;
  const saved = await store.get(key, { type: "json" }).catch(() => null);
  const existing = saved?.rows || [];
  const rows = mergeRows(existing, incoming, mode);
  const markets = await readJsonFile("data/markets.json");

  const payload = {
    market,
    rows,
    meta: {
      marketName: markets[market]?.name || market,
      source: "real-history-scraper",
      updatedAt: new Date().toISOString(),
      updatedRows: incoming.length,
      mode
    }
  };

  await store.set(key, JSON.stringify(payload), { contentType: "application/json" });
  return payload;
}

export const handler = async (event) => {
  connectLambda(event);
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };
  if (event.httpMethod !== "POST") return json(405, { ok: false, error: "method not allowed" });

  try {
    const body = JSON.parse(event.body || "{}");
    const expectedPin = process.env.ADMIN_PIN || "123456";
    if (String(body.adminPin || "") !== String(expectedPin)) {
      return json(401, { ok: false, error: "Master Update PIN ไม่ถูกต้อง" });
    }

    const markets = await readJsonFile("data/markets.json");
    const sources = await readJsonFile("data/real-history-sources.json");
    const requested = Array.isArray(body.markets) && body.markets.length ? body.markets : Object.keys(sources);
    const mode = body.mode === "append" ? "append" : "replace";
    const summary = [];
    const savedData = {};

    for (const market of requested) {
      if (!markets[market]) {
        summary.push({ market, ok: false, error: "market ไม่ถูกต้อง" });
        continue;
      }
      const cfg = sources[market];
      if (!cfg) {
        summary.push({ market, marketName: markets[market].name, ok: false, skipped: true, error: "ยังไม่มีแหล่งข้อมูลจริงที่ตั้งไว้" });
        continue;
      }
      try {
        const rows = await scrapeThaiOrcMarket(market, cfg);
        if (!rows.length) {
          summary.push({ market, marketName: markets[market].name, ok: false, error: "อ่านข้อมูลไม่พบ" });
          continue;
        }
        const saved = await saveMarketRows(market, rows, mode);
        summary.push({ market, marketName: markets[market].name, ok: true, imported: rows.length, total: saved.rows.length, source: cfg.source });
        savedData[market] = saved.rows;
      } catch (e) {
        summary.push({ market, marketName: markets[market]?.name || market, ok: false, error: e.message });
      }
    }

    return json(200, { ok: true, summary, data: savedData });
  } catch (err) {
    return json(500, { ok: false, error: err.message || "server error" });
  }
};
