import { Router } from 'express';
import axios from 'axios';
import cache from '../utils/cache.js';
const router = Router();

router.get('/:symbol', async (req, res, next) => {
  const symbol = req.params.symbol;
  const key = `price:${symbol.toUpperCase()}`;
  try {
    const cached = await cache.get(key);
    if (cached) return res.json(JSON.parse(cached));

    let result;
    if (process.env.PRICE_PROVIDER === 'FINNHUB') {
      const url = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${process.env.FINNHUB_KEY}`;
      const { data } = await axios.get(url);
      result = { symbol, current: data.c, open: data.o, high: data.h, low: data.l, prevClose: data.pc, timestamp: data.t };
    } else {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${process.env.ALPHA_KEY}`;
      const { data } = await axios.get(url);
      const q = data['Global Quote'] || {};
      result = {
        symbol,
        current: parseFloat(q['05. price']) || null,
        open: parseFloat(q['02. open']) || null,
        high: parseFloat(q['03. high']) || null,
        low: parseFloat(q['04. low']) || null,
        prevClose: parseFloat(q['08. previous close']) || null,
        timestamp: new Date().toISOString()
      };
    }

    await cache.set(key, JSON.stringify(result), { EX: Number(process.env.PRICE_CACHE_TTL || 10) });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
