
import { getStore, connectLambda } from "@netlify/blobs";
import { json, headers, readJsonFile } from "./utils.mjs";

export const handler = async (event) => {
  connectLambda(event);
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };
  try {
    const markets = await readJsonFile("data/markets.json");
    const seed = await readJsonFile("data/default-history.json");
    const store = getStore("lottery-results");
    const data = {};
    const summary = [];

    for (const market of Object.keys(markets)) {
      const saved = await store.get(`market-${market}`, { type: "json" }).catch(() => null);
      const rows = saved?.rows || seed[market] || [];
      data[market] = rows;
      summary.push({
        market,
        marketName: markets[market].name,
        count: rows.length,
        updatedAt: saved?.meta?.updatedAt || null,
        source: saved?.meta?.source || "default-history"
      });
    }

    return json(200, { ok: true, summary, data });
  } catch (err) {
    return json(500, { ok: false, error: err.message || "server error" });
  }
};
