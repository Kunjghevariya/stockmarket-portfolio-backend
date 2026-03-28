import { Watchlist } from '../model/watchlist.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const watchlists = asyncHandler(async (req, res) => {
  const list = await Watchlist.findOne({ user: req.user._id });
  if (!list) return res.status(200).json({ stocks: [] });
  res.json(list);
});

export const addwatchlist = asyncHandler(async (req, res) => {
  const { stockSymbol } = req.body;
  if (!stockSymbol) throw new ApiError(400, 'stockSymbol required');
  let list = await Watchlist.findOne({ user: req.user._id });
  if (!list) list = new Watchlist({ user: req.user._id, stocks: [stockSymbol] });
  else if (!list.stocks.includes(stockSymbol)) list.stocks.push(stockSymbol);
  await list.save();
  res.json(list);
});

export const removewatchlist = asyncHandler(async (req, res) => {
  const { stockSymbol } = req.body;
  const list = await Watchlist.findOne({ user: req.user._id });
  if (!list) throw new ApiError(400, 'Watchlist not found');
  list.stocks = list.stocks.filter(s => s !== stockSymbol);
  await list.save();
  res.json(list);
});
