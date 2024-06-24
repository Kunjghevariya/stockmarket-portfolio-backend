import { asyncHandler } from "../utills/asyncHandler.js";
import { ApiError } from "../utills/ApiError.js";
import { portfolio } from "../model/portfolio.model.js";
import { ApiResponse } from "../utills/ApiResponse.js";

const portfoliodata = asyncHandler(async (req, res) => {
    const Portfolio = await portfolio.findOne({ user: req.user.id });
    if (!Portfolio) {
        throw new ApiError(400, "Portfolio not found");
    }
    res.status(200).json(new ApiResponse(Portfolio, "Portfolio data fetched successfully"));
});

const buy = asyncHandler(async (req, res) => {
    const { symbol, quantity, purchasePrice } = req.body;
    let Portfolio = await portfolio.findOne({ user: req.user.id });
    if (!Portfolio) {
        Portfolio = new portfolio({ user: req.user.id, holdings: [{ symbol, quantity, purchasePrice }] });
    } else {
        const holding = Portfolio.holdings.find(h => h.symbol === symbol);
        if (holding) {
            holding.quantity += quantity;
            holding.purchasePrice = ((holding.purchasePrice * holding.quantity) + (purchasePrice * quantity)) / (holding.quantity + quantity);
        } else {
            Portfolio.holdings.push({ symbol, quantity, purchasePrice });
        }
    }
    await Portfolio.save();
    res.status(200).json(new ApiResponse(Portfolio, "Stock purchased successfully"));
});

const sell = asyncHandler(async (req, res) => {
    const { symbol, quantity } = req.body;
    let Portfolio = await portfolio.findOne({ user: req.user.id });
    if (!Portfolio) return res.status(400).json(new ApiResponse(null, 'Portfolio not found', false));

    const holding = Portfolio.holdings.find(h => h.symbol === symbol);
    if (!holding) return res.status(400).json(new ApiResponse(null, 'Stock not found in portfolio', false));
    if (holding.quantity < quantity) return res.status(400).json(new ApiResponse(null, 'Not enough quantity to sell', false));

    holding.quantity -= quantity;
    if (holding.quantity === 0) Portfolio.holdings = Portfolio.holdings.filter(h => h.symbol !== symbol);

    await Portfolio.save();
    res.status(200).json(new ApiResponse(Portfolio, "Stock sold successfully"));
});

export {
    portfoliodata, buy, sell
}
