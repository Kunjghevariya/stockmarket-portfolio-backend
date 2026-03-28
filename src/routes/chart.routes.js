import { Router } from 'express';
import cache from '../utils/cache.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { fetchChart } from '../services/external.js';

const router = Router();

router.get(
  '/:symbol',
  asyncHandler(async (req, res) => {
    const symbol = req.params.symbol;
    const range = req.query.range || '1mo';
    const cacheKey = `chart:${String(symbol).toUpperCase()}:${range}`;
    const cached = await cache.get(cacheKey);

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const points = await fetchChart(symbol, range);
    const payload = new ApiResponse(200, { symbol: String(symbol).toUpperCase(), range, points }, 'Chart fetched successfully');
    await cache.set(cacheKey, JSON.stringify(payload), { EX: Number(process.env.CHART_CACHE_TTL || 300) });

    return res.status(200).json(payload);
  })
);

export default router;
