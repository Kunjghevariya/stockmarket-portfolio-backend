import mongoose, { Schema } from "mongoose";

const watchlistSchema = new Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,

    },
    stocks: [
        {
          type: String,
        },
      ],
},
    {timestamps: true})




export const Watchlist = mongoose.model("watchlist", watchlistSchema)