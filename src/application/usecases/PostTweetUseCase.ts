import type { Tweet } from '../../domain/entities/Tweet';
import type { ITwitterClient } from '../../domain/repositories/TwitterClient';

export class PostTweetUseCase {
  constructor(private readonly twitter: ITwitterClient) {}

  async execute(text: string): Promise<Tweet> {
    const trimmed = text.trim();
    if (!trimmed) throw new Error('Tweet text is empty');
    // Basic length guard. X counts characters differently for emojis/links,
    // but 280 plain characters is a safe minimum for now.
    if (trimmed.length > 280) throw new Error('Tweet exceeds 280 characters');
    return this.twitter.postTweet(trimmed);
  }
}
