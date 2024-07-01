import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRouter from './routes/user.routes.js';
import stockRouter from './routes/stocks.routes.js';
import watchlistRoute from './routes/watchlist.routes.js';
import portfolioroutes from './routes/portfolio.routes.js';

const app = express();
const allowedOrigins = [
  'https://stockmarket-frontend.vercel.app',
  'https://stockmarket-frontend-dj9inwhjx-kunjghevariyas-projects.vercel.app/',
'https://stockmarket-frontend-4bsk5vo55-kunjghevariyas-projects.vercel.app',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(express.static('public'));
app.use(cookieParser());

app.use('/api/v1/users', userRouter);
app.use('/api/v1/stock', stockRouter);
app.use('/api/v1/watchlist', watchlistRoute); 
app.use('/api/v1/portfolio', portfolioroutes); 

export { app };
