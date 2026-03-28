import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import userRouter from './src/routes/user.routes.js';
import stockRouter from './src/routes/stocks.routes.js';
import watchlistRouter from './src/routes/watchlist.routes.js';
import portfolioRouter from './src/routes/portfolio.routes.js';
import priceRouter from './src/routes/price.routes.js';
import chartRouter from './src/routes/chart.routes.js';
import newsRouter from './src/routes/news.routes.js';
import { errorHandler } from './src/middleware/error.middleware.js';
import searchRouter from "./src/routes/search.routes.js";


const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// global rate limiter for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// routes
app.use('/api/v1/users', userRouter);
app.use('/api/v1/stock', stockRouter);
app.use('/api/v1/watchlist', watchlistRouter);
app.use('/api/v1/portfolio', portfolioRouter);
app.use('/api/v1/price', priceRouter);
app.use('/api/v1/chart', chartRouter);
app.use('/api/v1/news', newsRouter);
app.use("/api/v1/search", searchRouter);


// health
app.get('/healthz', (req, res) => res.json({ ok: true }));
app.get('/readyz', (req, res) => res.json({ ok: true }));

// error handler
app.use(errorHandler);

export { app };
