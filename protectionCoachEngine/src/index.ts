import { env } from './config/env';
import { connectMongo } from './config/mongo';
import pool from './config/database';
import app from './app';
import { registerScoreRecalcHandler } from './modules/events/handlers/score-recalc.handler';

async function main() {
  // Connect to MongoDB (optional — AI Chat won't work without it)
  await connectMongo();

  // Verify PostgreSQL connection (Neon)
  const client = await pool.connect();
  console.log('✅ PostgreSQL connected (Neon)');
  client.release();

  // Register event handlers
  registerScoreRecalcHandler();

  // Start Express server
  app.listen(env.PORT, () => {
    console.log(`\n🚀 Protection Intelligence Platform`);
    console.log(`   Server: http://localhost:${env.PORT}`);
    console.log(`   Env:    ${env.NODE_ENV}\n`);
  });
}

main().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
