import type { Tweet } from '../entities/Tweet';

export interface ITwitterClient {
  postTweet(text: string): Promise<Tweet>;
}
