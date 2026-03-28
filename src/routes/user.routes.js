import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  loginDemoUser,
} from '../controllers/user.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/demo-login', loginDemoUser);
router.post('/logout', verifyJWT, logoutUser);
router.post('/refresh-token', refreshAccessToken);
router.get('/me', verifyJWT, getCurrentUser);

export default router;
