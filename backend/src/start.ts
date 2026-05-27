import { execSync } from 'child_process';
import { prisma } from './db/prisma';
import { env } from './config/env';
import { app } from './app';

async function bootstrap() {
  // Ensure DB schema is up to date
  console.log('[start] Running prisma db push...');
  execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });

  // Seed demo data if no users exist yet
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    console.log('[start] Seeding demo data...');
    execSync('node dist/seed.js', { stdio: 'inherit' });
  } else {
    console.log(`[start] DB already has ${userCount} users — skipping seed.`);
  }

  app.listen(env.PORT, () => {
    console.log(`Creditly backend listening on port ${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('[start] Fatal error:', err);
  process.exit(1);
});
