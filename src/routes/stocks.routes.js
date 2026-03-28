import { Router } from 'express';
import getStocksData from '../controllers/stocks.controller.js';
const router = Router();

router.get('/:symbol', getStocksData);

export default router;
