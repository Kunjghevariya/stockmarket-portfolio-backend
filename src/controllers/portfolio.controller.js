import { Portfolio } from '../model/portfolio.model.js';
import { Transaction } from '../model/transaction.model.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import mongoose from 'mongoose';
import { fetchChart } from '../services/external.js';

const normalizeSymbol = (symbol) => String(symbol || '').trim().toUpperCase();

const ensurePositiveNumber = (value, fieldName) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new ApiError(400, `${fieldName} must be a positive number`);
  }

  return numericValue;
};

export const buildPortfolioSnapshot = async (userId) => {
  const portfolio = await Portfolio.findOne({ user: userId }).lean();
  if (!portfolio) {
    return {
      holdings: [],
      totalInvestment: 0,
      totalQuantity: 0,
      holdingsCount: 0,
    };
  }

  let totalInvestment = 0;
  let totalQuantity = 0;

  const holdings = portfolio.holdings.map((holding) => {
    const investedAmount = Number((Number(holding.quantity) * Number(holding.purchasePrice)).toFixed(2));
    totalInvestment += investedAmount;
    totalQuantity += Number(holding.quantity);

    return {
      ...holding,
      investedAmount,
    };
  });

  return {
    holdings,
    totalInvestment: Number(totalInvestment.toFixed(2)),
    totalQuantity: Number(totalQuantity.toFixed(2)),
    holdingsCount: holdings.length,
    updatedAt: portfolio.updatedAt,
  };
};

export const getPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await buildPortfolioSnapshot(req.user._id);
  return res.status(200).json(new ApiResponse(200, portfolio, 'Portfolio fetched successfully'));
});

export const getPortfolioPerformance = asyncHandler(async (req, res) => {
  const range = req.query.range || '1mo';
  const portfolio = await buildPortfolioSnapshot(req.user._id);

  if (portfolio.holdings.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, { range, points: [] }, 'Portfolio performance fetched successfully'));
  }

  const chartResponses = await Promise.allSettled(
    portfolio.holdings.map(async (holding) => ({
      holding,
      points: await fetchChart(holding.symbol, range),
    }))
  );

  const mergedTimeline = new Map();

  chartResponses.forEach((result) => {
    if (result.status !== 'fulfilled') {
      return;
    }

    result.value.points.forEach((point) => {
      const time = Number(point.time || point.timestamp);
      const close = Number(point.close ?? point.value ?? 0);
      if (!Number.isFinite(time) || !Number.isFinite(close)) {
        return;
      }

      const currentValue = mergedTimeline.get(time) || 0;
      mergedTimeline.set(
        time,
        currentValue + close * Number(result.value.holding.quantity || 0)
      );
    });
  });

  const points = Array.from(mergedTimeline.entries())
    .sort((left, right) => left[0] - right[0])
    .map(([timestamp, value]) => ({
      timestamp,
      value: Number(value.toFixed(2)),
    }));

  return res
    .status(200)
    .json(new ApiResponse(200, { range, points }, 'Portfolio performance fetched successfully'));
});

export const buy = asyncHandler(async (req, res) => {
  const symbol = normalizeSymbol(req.body.symbol);
  const quantity = ensurePositiveNumber(req.body.quantity, 'Quantity');
  const purchasePrice = ensurePositiveNumber(req.body.purchasePrice, 'Purchase price');
  if (!symbol) throw new ApiError(400, 'Symbol is required');

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
    await Transaction.create(
      [{ user: req.user._id, symbol, quantity, price: purchasePrice, type: 'buy', executedAt: new Date() }],
      { session }
    );
    await session.commitTransaction();
    const portfolio = await buildPortfolioSnapshot(req.user._id);
    res.status(201).json(new ApiResponse(201, portfolio, 'Stock purchased successfully'));
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

export const sell = asyncHandler(async (req, res) => {
  const symbol = normalizeSymbol(req.body.symbol);
  const quantity = ensurePositiveNumber(req.body.quantity, 'Quantity');
  const salePrice =
    typeof req.body.salePrice === 'undefined'
      ? null
      : ensurePositiveNumber(req.body.salePrice, 'Sale price');
  if (!symbol) throw new ApiError(400, 'Symbol is required');

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

    await Transaction.create(
      [
        {
          user: req.user._id,
          symbol,
          quantity,
          price: salePrice ?? holding.purchasePrice,
          type: 'sell',
          executedAt: new Date(),
        },
      ],
      { session }
    );
    await p.save({ session });
    await session.commitTransaction();
    const portfolio = await buildPortfolioSnapshot(req.user._id);
    res.status(200).json(new ApiResponse(200, portfolio, 'Stock sold successfully'));
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});
