import { Router } from "express";
import { portfoliodata, sell, buy } from "../controller/portfolio.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";



const portfolioroutes = Router();

portfolioroutes.route("/").get(verifyJWT, portfoliodata);
portfolioroutes.route("/sell").post(verifyJWT, sell);
portfolioroutes.route("/buy").post(verifyJWT, buy);

export default portfolioroutes;