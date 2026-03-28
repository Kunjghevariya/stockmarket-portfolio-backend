import { Router } from 'express';
import { portfoliodata, buy, sell } from '../controllers/portfolio.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
const router = Router();

router.get('/', verifyJWT, portfoliodata);
router.post('/buy', verifyJWT, buy);
router.post('/sell', verifyJWT, sell);

export default router;
