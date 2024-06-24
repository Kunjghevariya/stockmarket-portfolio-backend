import { Router } from "express";
import getStocksData from "../controller/stocks.controller.js";

const stockrouter = Router()

stockrouter.route("/:symbol").get(getStocksData)



export default stockrouter