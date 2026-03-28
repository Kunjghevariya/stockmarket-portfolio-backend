import { Router } from 'express';
import cache from '../utils/cache.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { fetchNewsFeed } from '../services/external.js';
const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const q = req.query.q || '';
    const country = req.query.country || 'us';
    const category = req.query.category || 'business';
    const pageSize = Number(req.query.pageSize || 20);
    const key = `news:${q}:${country}:${category}:${pageSize}`;
    const cached = await cache.get(key);
    if (cached) return res.json(JSON.parse(cached));

    const data = await fetchNewsFeed({ q, country, category, pageSize });
    const payload = new ApiResponse(200, data, 'News fetched successfully');
    await cache.set(key, JSON.stringify(payload), { EX: Number(process.env.NEWS_CACHE_TTL || 900) });
    res.json(payload);
  })
);

export default router;
