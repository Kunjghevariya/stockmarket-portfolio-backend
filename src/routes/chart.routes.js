import { Router } from "express";
import axios from "axios";

const router = Router();

router.get("/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;
    const range = req.query.range || "1mo";

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${range}`;

    const response = await axios.get(url);

    console.log("📡 Yahoo Raw Chart API Response Received");

    const result = response.data?.chart?.result?.[0];

    if (!result) {
      console.log("❌ No result found in Yahoo data");
      return res.json([]);
    }

    console.log("✔ Yahoo chart 'result' found");

    const timestamps = result.timestamp || [];

    // Debug timestamps
    console.log("⏱ timestamps length =", timestamps.length);

    const quote = result.indicators?.quote?.[0] || {};

    const {
      open = [],
      high = [],
      low = [],
      close = [],
    } = quote;

    // Debug OHLC arrays
    console.log("📊 open length =", open.length);
    console.log("📊 close length =", close.length);

    // Build candles safely
    const candles = timestamps.map((t, i) => ({
      time: t,
      open: open[i] ?? null,
      high: high[i] ?? null,
      low: low[i] ?? null,
      close: close[i] ?? null,
    }));

    return res.json(candles);
  } catch (err) {
    console.error("❌ Chart API error:", err.message);
    return res.status(500).json({ error: "Chart fetch error" });
  }
});

export default router;
