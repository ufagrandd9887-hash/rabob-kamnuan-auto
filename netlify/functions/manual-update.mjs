
import { getStore, connectLambda } from "@netlify/blobs";
import { json, headers, readJsonFile, cleanRow, parseCsv, mergeRows } from "./utils.mjs";

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
    const market = String(body.market || "");
    if (!market || !markets[market]) return json(400, { ok: false, error: "market ไม่ถูกต้อง" });

    const sourceUrl = String(body.sourceUrl || "");
    let incoming = [];
    if (Array.isArray(body.rows)) {
      incoming = body.rows.map(r => cleanRow(r, market, sourceUrl)).filter(Boolean);
    } else if (body.csvText) {
      incoming = parseCsv(body.csvText, market, sourceUrl);
    }

    if (!incoming.length) return json(400, { ok: false, error: "ไม่พบข้อมูลที่นำเข้าได้" });

    const store = getStore("lottery-results");
    const key = `market-${market}`;
    const seed = await readJsonFile("data/default-history.json");
    const saved = await store.get(key, { type: "json" }).catch(() => null);
    const existing = saved?.rows || seed[market] || [];
    const mode = body.mode === "replace" ? "replace" : "append";
    const rows = mergeRows(existing, incoming, mode);

    const payload = {
      market,
      rows,
      meta: {
        marketName: markets[market].name,
        source: "manual-netlify",
        updatedAt: new Date().toISOString(),
        updatedRows: incoming.length,
        mode,
        sourceUrl
      }
    };

    await store.set(key, JSON.stringify(payload), { contentType: "application/json" });
    return json(200, { ok: true, ...payload, count: rows.length });
  } catch (err) {
    return json(500, { ok: false, error: err.message || "server error" });
  }
};
