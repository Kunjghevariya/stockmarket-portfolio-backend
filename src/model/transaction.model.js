import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true, uppercase: true, trim: true },
  quantity: { type: Number, required: true, min: 0.000001 },
  price: { type: Number, required: true, min: 0 },
  type: { type: String, enum: ['buy', 'sell'], required: true },
  executedAt: { type: Date, default: Date.now },
}, { timestamps: true });

TransactionSchema.index({ user: 1, createdAt: -1 });

export const Transaction = mongoose.model('Transaction', TransactionSchema);
