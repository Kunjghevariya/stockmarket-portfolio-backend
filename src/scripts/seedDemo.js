import connectDB from '../db/index.js';
import { User } from '../model/user.model.js';
import { seedDemoData } from '../services/demoAccount.js';

async function seedPersistentDemoUser() {
  const username = String(process.env.DEMO_ACCOUNT_USERNAME || 'demo_trader').toLowerCase();
  const email = String(process.env.DEMO_ACCOUNT_EMAIL || 'demo@stockflow.demo').toLowerCase();
  const fullName = String(process.env.DEMO_ACCOUNT_FULLNAME || 'Demo Trader');
  const password = process.env.DEMO_ACCOUNT_PASSWORD;

  if (!password) {
    throw new Error('DEMO_ACCOUNT_PASSWORD is required to run seed:demo');
  }

  let user = await User.findOne({ username });

  if (!user) {
    user = await User.create({
      username,
      email,
      fullName,
      password,
      isDemo: true,
    });
  } else {
    user.email = email;
    user.fullName = fullName;
    user.isDemo = true;
    user.password = password;
    await user.save();
  }

  await seedDemoData(user._id);

  console.log(`Demo account seeded for ${username}`);
}

connectDB()
  .then(() => seedPersistentDemoUser())
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed demo account:', error.message);
    process.exit(1);
  });
