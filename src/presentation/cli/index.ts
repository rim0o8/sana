#!/usr/bin/env node
import { buildTweetAgent } from '../../infrastructure/ai/agent';
import { loadEnv } from '../../infrastructure/config/env';
import { createLogger } from '../../infrastructure/logging/logger';
import { TwitterApiClient } from '../../infrastructure/twitter/TwitterApiClient';

type Args = {
  topic?: string;
  style?: string;
  hashtags?: string;
  dryRun?: boolean;
  post?: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if ((a === '-t' || a === '--topic') && next) {
      args.topic = next;
      i++;
      continue;
    }
    if ((a === '-s' || a === '--style') && next) {
      args.style = next;
      i++;
      continue;
    }
    if (a === '--hashtags' && next) {
      args.hashtags = next;
      i++;
      continue;
    }
    if (a === '--dry-run') {
      args.dryRun = true;
      continue;
    }
    if (a === '--post') {
      args.post = true;
      continue;
    }
  }
  return args;
}

async function main() {
  const env = loadEnv();
  const logger = createLogger({ name: 'tweet-cli' });
  const args = parseArgs(process.argv);

  if (!args.topic) {
    console.error(
      'Usage: dev -- --topic "your topic" [--style tech|informative|marketing] [--hashtags on|off] [--post]'
    );
    process.exit(1);
  }

  const twitter = new TwitterApiClient({
    appKey: process.env.TWITTER_APP_KEY || '',
    appSecret: process.env.TWITTER_APP_SECRET || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
    logger,
  });

  const { run } = buildTweetAgent({ twitter, logger });

  const includeHashtags = args.hashtags ? args.hashtags !== 'off' : false;
  const style = (args.style as any) ?? undefined;

  // Default to dry-run unless --post is explicitly provided
  const shouldDryRun = args.post ? false : true;
  const result = await run({ topic: args.topic, includeHashtags, style, dryRun: shouldDryRun });

  logger.info(
    { generatedText: result.generatedText, posted: result.posted },
    result.posted ? 'Tweet posted' : 'Dry run complete'
  );
  if (!result.posted) {
    console.log('\nGenerated tweet (not posted):');
    console.log(result.generatedText);
  } else {
    console.log(`\nTweet posted: ${result.posted.url ?? result.posted.id}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
