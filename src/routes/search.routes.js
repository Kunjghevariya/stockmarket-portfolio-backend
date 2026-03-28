import { Router } from "express";
import axios from "axios";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const q = (req.query.q || "").trim().toUpperCase();
    if (!q) return res.json([]);

    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
      q
    )}&quotesCount=20&newsCount=0`;

    let data;

    try {
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
          Accept: "application/json, text/plain, */*",
        }
      });

      data = response.data;
    } catch (err) {
      console.log("Yahoo Finance Error:", err.message);
      return res.json([]); // fail-safe
    }

    const quotes = Array.isArray(data?.quotes) ? data.quotes : [];

    const results = quotes
      .map((item) => ({
        symbol: item.symbol,
        shortname: item.shortname || item.longname || item.symbol,
        exchange: item.exchangeDisplay || "",
        type: item.quoteType,
      }))
      .filter((i) => i.symbol?.toUpperCase().startsWith(q));

    return res.json(results);
  } catch (error) {
    console.log("Search Route Fatal:", error.message);
    return res.json([]); // fail-safe
  }
});

export default router;
