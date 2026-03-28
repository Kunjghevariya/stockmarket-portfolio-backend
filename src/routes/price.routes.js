import { Router } from 'express';
import cache from '../utils/cache.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { fetchQuote } from '../services/external.js';
const router = Router();

router.get(
  '/:symbol',
  asyncHandler(async (req, res) => {
    const symbol = req.params.symbol;
    const key = `price:${String(symbol).toUpperCase()}`;
    const cached = await cache.get(key);
    if (cached) return res.json(JSON.parse(cached));

    const quote = await fetchQuote(symbol);
    const payload = new ApiResponse(200, quote, 'Quote fetched successfully');
    await cache.set(key, JSON.stringify(payload), { EX: Number(process.env.PRICE_CACHE_TTL || 15) });
    res.json(payload);
  })
);

export default router;
