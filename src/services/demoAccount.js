import crypto from 'crypto';
import { Portfolio } from '../model/portfolio.model.js';
import { Transaction } from '../model/transaction.model.js';
import { Watchlist } from '../model/watchlist.model.js';

const demoHoldings = [
  { symbol: 'AAPL', quantity: 12, purchasePrice: 168.45, purchaseDate: daysAgo(28) },
  { symbol: 'MSFT', quantity: 8, purchasePrice: 392.1, purchaseDate: daysAgo(24) },
  { symbol: 'NVDA', quantity: 5, purchasePrice: 843.2, purchaseDate: daysAgo(18) },
  { symbol: 'GOOGL', quantity: 7, purchasePrice: 142.85, purchaseDate: daysAgo(12) },
];

const demoWatchlist = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'TSLA', 'META'];

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export function buildDemoCredentials() {
  const suffix = crypto.randomBytes(3).toString('hex');
  const password = `Demo-${crypto.randomBytes(4).toString('hex')}`;

  return {
    username: `demo_${suffix}`,
    email: `demo_${suffix}@stockflow.demo`,
    fullName: 'Demo Trader',
    password,
  };
}

export async function seedDemoData(userId) {
  await Portfolio.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        holdings: demoHoldings,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await Watchlist.findOneAndUpdate(
    { user: userId },
    {
      $set: {
        stocks: demoWatchlist,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await Transaction.deleteMany({ user: userId });
  await Transaction.insertMany([
    { user: userId, symbol: 'AAPL', quantity: 12, price: 168.45, type: 'buy', executedAt: daysAgo(28) },
    { user: userId, symbol: 'MSFT', quantity: 8, price: 392.1, type: 'buy', executedAt: daysAgo(24) },
    { user: userId, symbol: 'NVDA', quantity: 5, price: 843.2, type: 'buy', executedAt: daysAgo(18) },
    { user: userId, symbol: 'GOOGL', quantity: 7, price: 142.85, type: 'buy', executedAt: daysAgo(12) },
  ]);
}
