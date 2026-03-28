import { Router } from 'express';
import axios from 'axios';
import cache from '../utils/cache.js';
const router = Router();

router.get('/', async (req, res, next) => {
  const q = req.query.q || '';
  const country = req.query.country || 'us';
  const category = req.query.category || 'business';
  const pageSize = Number(req.query.pageSize || 20);
  const key = `news:${q}:${country}:${category}:${pageSize}`;

  try {
    const cached = await cache.get(key);
    if (cached) return res.json(JSON.parse(cached));

    let url = `https://newsapi.org/v2/top-headlines?country=${country}&category=${category}&pageSize=${pageSize}&apiKey=${process.env.NEWSAPI_KEY}`;
    if (q) url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&pageSize=${pageSize}&apiKey=${process.env.NEWSAPI_KEY}`;

    const { data } = await axios.get(url);
    await cache.set(key, JSON.stringify(data), { EX: Number(process.env.NEWS_CACHE_TTL || 900) });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
