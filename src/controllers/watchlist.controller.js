import { Watchlist } from '../model/watchlist.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const normalizeSymbol = (symbol) => String(symbol || '').trim().toUpperCase();

export const getWatchlist = asyncHandler(async (req, res) => {
  const list = await Watchlist.findOne({ user: req.user._id }).lean();
  const stocks = Array.isArray(list?.stocks) ? list.stocks : [];
  return res.status(200).json(new ApiResponse(200, { stocks }, 'Watchlist fetched successfully'));
});

export const addToWatchlist = asyncHandler(async (req, res) => {
  const stockSymbol = normalizeSymbol(req.body.stockSymbol);
  if (!stockSymbol) throw new ApiError(400, 'stockSymbol required');

  const list = await Watchlist.findOneAndUpdate(
    { user: req.user._id },
    { $addToSet: { stocks: stockSymbol } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, { stocks: list.stocks }, 'Watchlist updated successfully'));
});

export const removeFromWatchlist = asyncHandler(async (req, res) => {
  const stockSymbol = normalizeSymbol(req.body.stockSymbol);
  if (!stockSymbol) throw new ApiError(400, 'stockSymbol required');

  const list = await Watchlist.findOneAndUpdate(
    { user: req.user._id },
    { $pull: { stocks: stockSymbol } },
    { new: true }
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      { stocks: Array.isArray(list?.stocks) ? list.stocks : [] },
      'Watchlist updated successfully'
    )
  );
});
