import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import userRouter from './src/routes/user.routes.js';
import watchlistRouter from './src/routes/watchlist.routes.js';
import portfolioRouter from './src/routes/portfolio.routes.js';
import priceRouter from './src/routes/price.routes.js';
import chartRouter from './src/routes/chart.routes.js';
import newsRouter from './src/routes/news.routes.js';
import searchRouter from './src/routes/search.routes.js';
import transactionsRouter from './src/routes/transactions.routes.js';

import { errorHandler } from './src/middleware/error.middleware.js';

const app = express();

// 🔐 Security + utils
app.use(helmet());
app.use(compression());
app.use(morgan('combined'));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =======================================================
   ✅ CORS (ALLOW ALL ORIGINS — NO ERRORS)
======================================================= */
app.use(cors({
  origin: true, // allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ Handle preflight (VERY IMPORTANT)
app.options('*', cors());

/* =======================================================
   ✅ RATE LIMITER (skip OPTIONS to avoid CORS failure)
======================================================= */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', (req, res, next) => {
  if (req.method === 'OPTIONS') return next(); // ✅ skip preflight
  return apiLimiter(req, res, next);
});

/* =======================================================
   🚀 ROUTES
======================================================= */
app.use('/api/v1/users', userRouter);
app.use('/api/v1/watchlist', watchlistRouter);
app.use('/api/v1/portfolio', portfolioRouter);
app.use('/api/v1/price', priceRouter);
app.use('/api/v1/chart', chartRouter);
app.use('/api/v1/news', newsRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/transactions', transactionsRouter);

/* =======================================================
   ❤️ HEALTH CHECK
======================================================= */
app.get('/healthz', (req, res) => res.json({ ok: true }));
app.get('/readyz', (req, res) => res.json({ ok: true }));

/* =======================================================
   ❌ ERROR HANDLER
======================================================= */
app.use(errorHandler);

export { app };