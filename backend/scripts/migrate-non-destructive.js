#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');

const backendRoot = resolve(__dirname, '..');
const schemaPath = resolve(backendRoot, 'prisma/schema.prisma');
const migrationsPath = resolve(backendRoot, 'prisma/migrations');

function run(label, command, args) {
  console.log(`\n→ ${label}`);
  const result = spawnSync(command, args, {
    cwd: backendRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. Refusing to run migrations without an explicit target database.');
  process.exit(1);
}

if (!existsSync(schemaPath)) {
  console.error(`Missing Prisma schema at ${schemaPath}`);
  process.exit(1);
}

if (!existsSync(migrationsPath)) {
  console.error(`Missing Prisma migrations directory at ${migrationsPath}`);
  process.exit(1);
}

console.log('Running non-destructive backend migration.');
console.log('This script only runs Prisma migrate deploy and Prisma generate.');
console.log('It does not run db push, migrate reset, or seed.');

run('Apply pending migrations', 'npx', ['prisma', 'migrate', 'deploy']);
run('Regenerate Prisma client', 'npx', ['prisma', 'generate']);

console.log('\n✅ Non-destructive backend migration completed.');
