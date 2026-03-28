import { Router } from 'express';
import cache from '../utils/cache.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { searchMarket } from '../services/external.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.json([]);
    }

    const cacheKey = `search:${q.toUpperCase()}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const results = await searchMarket(q);
    await cache.set(cacheKey, JSON.stringify(results), { EX: Number(process.env.SEARCH_CACHE_TTL || 300) });
    return res.json(results);
  })
);

export default router;
