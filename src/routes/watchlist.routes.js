import { Router } from 'express';
import { watchlists, addwatchlist, removewatchlist } from '../controllers/watchlist.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
const router = Router();

router.get('/', verifyJWT, watchlists);
router.post('/add', verifyJWT, addwatchlist);
router.post('/remove', verifyJWT, removewatchlist);

export default router;
