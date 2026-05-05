import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async () => {
  console.log('🌱 Setting up E2E test database...');

  try {
    // Step 1: Terminate existing connections and drop/recreate DB
    console.log('  Terminating connections...');
    await execAsync(
      "docker exec trip-planner-db-1 psql -U postgres -d postgres -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='tripplanner' AND pid <> pg_backend_pid();\"",
      { timeout: 10000 }
    );

    // Retry loop handles cases where DROP fails due to lingering connections
    let dropSucceeded = false;
    for (let attempt = 1; attempt <= 3 && !dropSucceeded; attempt++) {
      console.log(`  Dropping DB (attempt ${attempt})...`);
      const { stdout } = await execAsync(
        'docker exec trip-planner-db-1 psql -U postgres -d postgres -c "DROP DATABASE IF EXISTS tripplanner;"',
        { timeout: 10000 }
      );
      if (stdout.includes('DROP DATABASE') || stdout.trim() === '') {
        dropSucceeded = true;
      } else {
        console.warn(`  Drop attempt ${attempt} warning: ${stdout}`);
        if (attempt < 3) await new Promise(r => setTimeout(r, 2000));
      }
    }

    // Brief pause after DROP to let connections fully release before CREATE
    await new Promise(r => setTimeout(r, 1500));
    console.log('  Creating DB...');
    await execAsync(
      'docker exec trip-planner-db-1 psql -U postgres -d postgres -c "CREATE DATABASE tripplanner;"',
      { timeout: 10000 }
    );
    console.log('  ✅ Database recreated');

    // Step 2: Generate Prisma Client
    console.log('  Generating Prisma Client...');
    await execAsync(
      'cd /mnt/user/development/trip-planner/backend && npx prisma generate',
      { timeout: 30000 }
    );
    console.log('  ✅ Client generated');

    // Step 3: Push schema with force-reset (fresh DB needs this)
    // NOTE: Do NOT use --skip-generate here. After force-reset Prisma needs to
    // regenerate the client so it can verify the schema matches the database.
    console.log('  Pushing schema...');
    await execAsync(
      'cd /mnt/user/development/trip-planner/backend && npx prisma db push --accept-data-loss --force-reset',
      { timeout: 60000 }
    );
    console.log('  ✅ Schema pushed');

    // Step 4: Seed using tsx (TypeScript seed, not compiled JS)
    // TSX_CACHE=0 prevents tsx from caching stale Prisma client bindings
    console.log('  Running seed (via tsx)...');
    await execAsync(
      'cd /mnt/user/development/trip-planner/backend && TSX_CACHE=0 npx tsx --no-cache prisma/seed.ts',
      { timeout: 60000 }
    );
    console.log('  ✅ Database seeded');

    console.log('🌱 E2E test database ready');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
};
