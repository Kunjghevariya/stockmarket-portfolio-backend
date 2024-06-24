import { asyncHandler } from "../utills/asyncHandler.js";
import { ApiError } from "../utills/ApiError.js";
import { User } from "../model/user.model.js";
import axios from 'axios';


const getStocksData = asyncHandler(async (req, res, next) => {
  const symbol = req.params.symbol;

    const options = {
        method: 'GET',
        url: 'https://apidojo-yahoo-finance-v1.p.rapidapi.com/market/v2/get-quotes',
        params: {
          region: 'US',
          symbols: symbol
        },
        headers: {
          'x-rapidapi-key': 'f64a095c8dmsh16932327a2edd85p1f127cjsne428e048a2d7',
          'x-rapidapi-host': 'apidojo-yahoo-finance-v1.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        res.json(response.data);  
    } catch (error) {
        console.error(error);
        next(new ApiError('Failed to fetch stock data', 500));  
    }
});

export default getStocksData;
