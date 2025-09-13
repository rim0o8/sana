import { describe, it, expect } from 'vitest';
import { PostTweetUseCase } from '../src/application/usecases/PostTweetUseCase';
import type { ITwitterClient } from '../src/domain/repositories/TwitterClient';

class FakeTwitterClient implements ITwitterClient {
  async postTweet(text: string) {
    return { id: '1', text, createdAt: new Date(), url: `https://x.com/i/web/status/1` };
  }
}

describe('PostTweetUseCase', () => {
  it('posts a trimmed tweet', async () => {
    const uc = new PostTweetUseCase(new FakeTwitterClient());
    const res = await uc.execute('  hello world  ');
    expect(res.text).toBe('hello world');
    expect(res.id).toBe('1');
  });

  it('rejects empty tweet', async () => {
    const uc = new PostTweetUseCase(new FakeTwitterClient());
    await expect(uc.execute('   ')).rejects.toThrow('Tweet text is empty');
  });

  it('rejects > 280 chars', async () => {
    const uc = new PostTweetUseCase(new FakeTwitterClient());
    const long = 'x'.repeat(281);
    await expect(uc.execute(long)).rejects.toThrow('Tweet exceeds 280 characters');
  });
});
