import { Transaction } from '../model/transaction.model.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listTransactions = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(250, Math.max(1, Number(req.query.pageSize || 50)));
  const type = String(req.query.type || 'all').toLowerCase();
  const query = { user: req.user._id };

  if (type === 'buy' || type === 'sell') {
    query.type = type;
  }

  const [items, total] = await Promise.all([
    Transaction.find(query)
      .sort({ executedAt: -1, createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Transaction.countDocuments(query),
  ]);

  const normalizedItems = items.map((transaction) => ({
    ...transaction,
    executedAt: transaction.executedAt || transaction.date || transaction.createdAt,
    totalValue: Number((Number(transaction.quantity || 0) * Number(transaction.price || 0)).toFixed(2)),
  }));

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: normalizedItems,
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      'Transactions fetched successfully'
    )
  );
});
