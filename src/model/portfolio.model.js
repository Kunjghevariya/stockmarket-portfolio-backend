import mongoose from "mongoose";
const PortfolioSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  holdings: [
    {
      symbol: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      purchasePrice: {
        type: Number,
        required: true,
      },
      purchaseDate: {
        type: Date,
        default: Date.now,
      },
    },
  ],
},{
    timestamps:true,
});




export const portfolio = mongoose.model("portfolio", PortfolioSchema)