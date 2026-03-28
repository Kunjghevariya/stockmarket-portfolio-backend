import dotenv from 'dotenv';
dotenv.config();

import connectDB from './src/db/index.js';
import { app } from './app.js';

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`⚙️ Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err);
    process.exit(1);
  });
