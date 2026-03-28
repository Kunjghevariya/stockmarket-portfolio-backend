import { Portfolio } from '../model/portfolio.model.js';
import { Transaction } from '../model/transaction.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import mongoose from 'mongoose';

export const portfoliodata = asyncHandler(async (req, res) => {
  const p = await Portfolio.findOne({ user: req.user._id }).lean();
  if (!p) return res.status(200).json({ holdings: [] });
  let totalInvestment = 0;
  const holdings = p.holdings.map(h => {
    const stockInvestment = h.quantity * h.purchasePrice;
    totalInvestment += stockInvestment;
    return { ...h, stockInvestment };
  });
  res.json({ ...p, holdings, totalInvestment: Number(totalInvestment.toFixed(2)) });
});

export const buy = asyncHandler(async (req, res) => {
  const { symbol, quantity, purchasePrice } = req.body;
  if (!symbol || !quantity || !purchasePrice) throw new ApiError(400, 'Invalid payload');

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    let p = await Portfolio.findOne({ user: req.user._id }).session(session);
    if (!p) {
      p = new Portfolio({ user: req.user._id, holdings: [{ symbol, quantity, purchasePrice }] });
    } else {
      const holding = p.holdings.find(h => h.symbol === symbol);
      if (holding) {
        // update average cost
        const totalQty = holding.quantity + Number(quantity);
        holding.purchasePrice = ((holding.purchasePrice * holding.quantity) + (purchasePrice * quantity)) / totalQty;
        holding.quantity = totalQty;
      } else {
        p.holdings.push({ symbol, quantity, purchasePrice });
      }
    }
    await p.save({ session });
    await Transaction.create([{ user: req.user._id, symbol, quantity, price: purchasePrice, type: 'buy' }], { session });
    await session.commitTransaction();
    res.json(await Portfolio.findOne({ user: req.user._id }));
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

export const sell = asyncHandler(async (req, res) => {
  const { symbol, quantity } = req.body;
  if (!symbol || !quantity) throw new ApiError(400, 'Invalid payload');

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const p = await Portfolio.findOne({ user: req.user._id }).session(session);
    if (!p) throw new ApiError(400, 'Portfolio not found');
    const holding = p.holdings.find(h => h.symbol === symbol);
    if (!holding) throw new ApiError(400, 'Holding not found');
    if (holding.quantity < quantity) throw new ApiError(400, 'Not enough shares to sell');

    holding.quantity -= quantity;
    if (holding.quantity <= 0) p.holdings = p.holdings.filter(h => h.symbol !== symbol);

    await Transaction.create([{ user: req.user._id, symbol, quantity, price: 0, type: 'sell' }], { session });
    await p.save({ session });
    await session.commitTransaction();
    res.json(await Portfolio.findOne({ user: req.user._id }));
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});
