import { loadEnv } from '../../infrastructure/config/env';
import { createLogger } from '../../infrastructure/logging/logger';
import { TwitterApiClient } from '../../infrastructure/twitter/TwitterApiClient';
import { createServer } from './server';

async function main() {
  loadEnv();
  const logger = createLogger({ name: 'http' });

  const twitter = new TwitterApiClient({
    appKey: process.env.TWITTER_APP_KEY || '',
    appSecret: process.env.TWITTER_APP_SECRET || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
    logger,
  });

  const app = createServer({ twitter });
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '0.0.0.0';

  try {
    await app.listen({ port, host });
    logger.info({ port, host }, 'HTTP server started');
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

main();
