import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async () => {
  // Only seed in CI environment — skip during manual local runs
  if (process.env.CI !== 'true') {
    console.log('⏭️ Skipping E2E seed (CI=false). Run with CI=true to seed.');
    return;
  }
  
  console.log('🌱 Setting up E2E test database (CI=true)...');
  
  try {
    await execAsync('cd /mnt/user/development/trip-planner/backend && npx prisma db push --accept-data-loss', { timeout: 30000 });
    console.log('✅ Schema pushed');
    
    await execAsync('cd /mnt/user/development/trip-planner/backend && npm run db:seed', { timeout: 30000 });
    console.log('✅ Database seeded');
    
    console.log('🌱 E2E test database ready');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
};
