import { asyncHandler } from "../utills/asyncHandler.js";
import { ApiError } from "../utills/ApiError.js";
import { Watchlist } from "../model/watchlist.model.js";
import { ApiResponse } from "../utills/ApiResponse.js";

const watchlists = asyncHandler(async (req, res) => {
    const watchlist = await Watchlist.findOne({ user: req.user.id });
    if (!watchlist) {
        throw new ApiError(400, "Watchlist not found");
    }
    res.status(200).json(watchlist);
});

const addwatchlist = asyncHandler(async (req, res) => {
    const { stockSymbol } = req.body;

    let watchlist = await Watchlist.findOne({ user: req.user.id });
    if (!watchlist) {
        watchlist = new Watchlist({ user: req.user.id, stocks: [stockSymbol] });
    } else {
        if (watchlist.stocks.includes(stockSymbol)) {
            return res.status(400).json(new ApiResponse(400, watchlist, "Watchlist updated"));
        }
        watchlist.stocks.push(stockSymbol);
    }
    await watchlist.save();
    res.status(200).json(watchlist);
});

const removewatchlist = asyncHandler(async (req, res) => {
    const { stockSymbol } = req.body;
    let watchlist = await Watchlist.findOne({ user: req.user.id });
    if (!watchlist) {
        throw new ApiError(400, "Watchlist not found");
    }
    watchlist.stocks = watchlist.stocks.filter(symbol => symbol !== stockSymbol);
    await watchlist.save();
    res.status(200).json(watchlist);
});

export { watchlists, addwatchlist, removewatchlist };
