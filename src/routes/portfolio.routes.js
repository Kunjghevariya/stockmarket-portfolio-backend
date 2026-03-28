import { Router } from 'express';
import { getPortfolio, getPortfolioPerformance, buy, sell } from '../controllers/portfolio.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
const router = Router();

router.get('/', verifyJWT, getPortfolio);
router.get('/performance', verifyJWT, getPortfolioPerformance);
router.post('/buy', verifyJWT, buy);
router.post('/sell', verifyJWT, sell);

export default router;
