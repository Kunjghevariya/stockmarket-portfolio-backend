import axios from "axios";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

// Detect NSE or Crypto automatically
function normalizeSymbol(sym) {
  sym = sym.toUpperCase().trim();

  // Crypto auto-detect
  if (sym === "BTC") return "BINANCE:BTCUSDT";
  if (sym === "ETH") return "BINANCE:ETHUSDT";

  // NSE auto-detect for Indian stocks
  const NSE = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "TATASTEEL", "WIPRO"];
  if (NSE.includes(sym)) return `NSE:${sym}`;

  return sym; // default US stocks
}

function isFinnhubEmpty(data) {
  return (
    data &&
    data.c === 0 &&
    data.h === 0 &&
    data.l === 0 &&
    data.o === 0 &&
    data.pc === 0
  );
}

// Normalized final output
function formatPrice(provider, symbol, priceObject) {
  return {
    provider,
    symbol,
    current: priceObject.current ?? null,
    open: priceObject.open ?? null,
    high: priceObject.high ?? null,
    low: priceObject.low ?? null,
    prevClose: priceObject.prevClose ?? null,
    timestamp: priceObject.timestamp ?? Date.now(),
  };
}

export default asyncHandler(async (req, res, next) => {
  const raw = req.params.symbol;
  if (!raw) throw new ApiError(400, "Symbol required");

  const symbol = normalizeSymbol(raw);

  try {
    //-------------------------------
    // 1️⃣ FINNHUB (PRIMARY)
    //-------------------------------
    try {
      const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(
        symbol
      )}&token=${process.env.FINNHUB_KEY}`;
      const { data } = await axios.get(url);

      if (!isFinnhubEmpty(data)) {
        return res.json(
          formatPrice("FINNHUB", symbol, {
            current: data.c,
            open: data.o,
            high: data.h,
            low: data.l,
            prevClose: data.pc,
            timestamp: data.t,
          })
        );
      }
      console.log("⚠ FINNHUB returned empty");
    } catch (e) {
      console.log("⚠ Finnhub error:", e.message);
    }

    //-------------------------------
    // 2️⃣ YAHOO FINANCE (FALLBACK)
    //-------------------------------
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${raw}?interval=1d&range=1d`;
      const { data } = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      const r = data.chart?.result?.[0];
      if (r) {
        const q = r.indicators?.quote?.[0];
        const i = q.close.length - 1;

        return res.json(
          formatPrice("YAHOO", raw, {
            current: q.close[i] ?? r.meta?.regularMarketPrice,
            open: q.open[i],
            high: q.high[i],
            low: q.low[i],
            prevClose: r.meta?.chartPreviousClose,
            timestamp: r.timestamp?.[i],
          })
        );
      }
      console.log("⚠ Yahoo returned empty");
    } catch (e) {
      console.log("⚠ Yahoo error:", e.message);
    }

    //-------------------------------
    // 3️⃣ ALPHA VANTAGE (LAST RESORT)
    //-------------------------------
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
        raw
      )}&apikey=${process.env.ALPHA_KEY}`;

      const { data } = await axios.get(url);
      const g = data["Global Quote"] || {};

      if (g["05. price"]) {
        return res.json(
          formatPrice("ALPHAVANTAGE", raw, {
            current: parseFloat(g["05. price"]),
            open: parseFloat(g["02. open"]),
            high: parseFloat(g["03. high"]),
            low: parseFloat(g["04. low"]),
            prevClose: parseFloat(g["08. previous close"]),
            timestamp: Date.now(),
          })
        );
      }
      console.log("⚠ Alpha returned empty");
    } catch (e) {
      console.log("⚠ Alpha error:", e.message);
    }

    //-------------------------------
    // ❌ ALL FAILED
    //-------------------------------
    return next(new ApiError(500, "All price providers failed to fetch data"));
  } catch (err) {
    console.error(err);
    next(new ApiError(500, "Internal server error"));
  }
});
