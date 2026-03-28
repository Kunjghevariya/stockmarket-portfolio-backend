import mongoose from 'mongoose';

const WatchlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  stocks: [{ type: String, uppercase: true, trim: true }],
}, { timestamps: true });

WatchlistSchema.index({ user: 1 }, { unique: true });

export const Watchlist = mongoose.model('Watchlist', WatchlistSchema);
