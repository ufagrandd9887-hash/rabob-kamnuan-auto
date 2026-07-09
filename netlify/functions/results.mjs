
import { getStore, connectLambda } from "@netlify/blobs";
import { json, headers, readJsonFile } from "./utils.mjs";

async function getDefaultRows(market) {
  const seed = await readJsonFile("data/default-history.json");
  return seed[market] || [];
}

export const handler = async (event) => {
  connectLambda(event);
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers };
  try {
    const markets = await readJsonFile("data/markets.json");
    const market = event.queryStringParameters?.market || "";
    if (!market || !markets[market]) return json(400, { ok: false, error: "market ไม่ถูกต้อง" });

    const store = getStore("lottery-results");
    let saved = await store.get(`market-${market}`, { type: "json" }).catch(() => null);
    if (!saved) {
      const rows = await getDefaultRows(market);
      saved = {
        market,
        rows,
        meta: {
          marketName: markets[market].name,
          source: "default-history",
          updatedAt: null,
          note: "ข้อมูลตั้งต้นจากไฟล์ default-history.json"
        }
      };
    }

    return json(200, { ok: true, ...saved, count: (saved.rows || []).length });
  } catch (err) {
    return json(500, { ok: false, error: err.message || "server error" });
  }
};
