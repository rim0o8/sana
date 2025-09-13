import { TwitterApi } from 'twitter-api-v2';
import type { Tweet } from '../../domain/entities/Tweet';
import type { ITwitterClient } from '../../domain/repositories/TwitterClient';
import type { Logger } from '../logging/logger';

export type TwitterApiClientOptions = {
  appKey: string;
  appSecret: string;
  accessToken: string;
  accessSecret: string;
  logger?: Logger;
};

export class TwitterApiClient implements ITwitterClient {
  private client: TwitterApi;
  private logger?: Logger;

  constructor(opts: TwitterApiClientOptions) {
    this.client = new TwitterApi({
      appKey: opts.appKey,
      appSecret: opts.appSecret,
      accessToken: opts.accessToken,
      accessSecret: opts.accessSecret,
    });
    this.logger = opts.logger;
  }

  async postTweet(text: string): Promise<Tweet> {
    this.logger?.info({ text }, 'Posting tweet');
    const rw = this.client.readWrite;
    const res = await rw.v2.tweet(text);
    const id = res.data.id;
    const url = `https://x.com/i/web/status/${id}`;
    this.logger?.info({ id, url }, 'Tweet posted');
    return { id, text, createdAt: new Date(), url };
  }
}
