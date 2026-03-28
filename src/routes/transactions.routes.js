import { Router } from 'express';
import { listTransactions } from '../controllers/transaction.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', verifyJWT, listTransactions);

export default router;
