import pool from '../config/database';
import { generateAndCacheInsights } from '../modules/scoring/insights-generator';

/**
 * One-time script to generate AI insights for all existing customers.
 * Run after:  npm run db:migrate-v3 && npm run db:seed
 * Command:    npm run generate-insights
 *
 * This calls Gemini for each customer sequentially (to avoid rate limits).
 */

async function generateAll() {
  console.log('🤖 Generating AI insights for all customers...\n');

  try {
    const result = await pool.query(`SELECT id, first_name, last_name FROM customers ORDER BY created_at`);
    const customers = result.rows;

    if (customers.length === 0) {
      console.log('⚠️ No customers found. Run db:seed first.');
      return;
    }

    console.log(`   Found ${customers.length} customers.\n`);

    let success = 0;
    let failed = 0;

    for (const customer of customers) {
      try {
        await generateAndCacheInsights(customer.id, 'INITIAL_SEED');
        success++;
        console.log(`   ✅ ${customer.first_name} ${customer.last_name}`);
      } catch (error: any) {
        failed++;
        console.log(`   ❌ ${customer.first_name} ${customer.last_name}: ${error.message}`);
      }

      // Small delay between calls to avoid Gemini rate limits
      await new Promise((r) => setTimeout(r, 1500));
    }

    console.log(`\n🎉 Done! ${success} generated, ${failed} failed.`);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

generateAll();
