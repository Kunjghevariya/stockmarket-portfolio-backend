import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { addwatchlist, removewatchlist, watchlists } from '../controller/watchlist.controller.js';

const watchlistRoute = Router();

watchlistRoute.route("/").get(verifyJWT, watchlists);
watchlistRoute.route("/add").post(verifyJWT, addwatchlist);
watchlistRoute.route("/remove").post(verifyJWT, removewatchlist);

export default watchlistRoute;
