import mongoose from 'mongoose';

const HoldingSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true, trim: true },
  quantity: { type: Number, required: true, min: 0.000001 },
  purchasePrice: { type: Number, required: true, min: 0 },
  purchaseDate: { type: Date, default: Date.now },
}, { _id: false });

const PortfolioSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  holdings: [HoldingSchema],
}, { timestamps: true });

PortfolioSchema.index({ user: 1 }, { unique: true });

export const Portfolio = mongoose.model('Portfolio', PortfolioSchema);
