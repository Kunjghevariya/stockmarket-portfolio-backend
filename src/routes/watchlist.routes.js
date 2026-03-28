import { Router } from 'express';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../controllers/watchlist.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
const router = Router();

router.get('/', verifyJWT, getWatchlist);
router.post('/add', verifyJWT, addToWatchlist);
router.post('/remove', verifyJWT, removeFromWatchlist);

export default router;
