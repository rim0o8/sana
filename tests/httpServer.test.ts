import { beforeEach, describe, expect, it } from 'vitest';
import type { Tweet } from '../src/domain/entities/Tweet';
import type { ITwitterClient } from '../src/domain/repositories/TwitterClient';
import { createServer } from '../src/presentation/http/server';

describe('HTTP API - POST /tweets', () => {
  let twitter: ITwitterClient;

  beforeEach(() => {
    twitter = {
      async postTweet(text: string): Promise<Tweet> {
        return {
          id: '123',
          text,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          url: 'https://x.com/i/web/status/123',
        };
      },
    };
  });

  it('returns 201 and the posted tweet for valid text', async () => {
    const app = createServer({ twitter });
    const res = await app.inject({
      method: 'POST',
      url: '/tweets',
      payload: { text: 'hello world' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as any;
    expect(body.id).toBe('123');
    expect(body.text).toBe('hello world');
  });

  it('returns 400 when text is empty', async () => {
    const app = createServer({ twitter });
    const res = await app.inject({ method: 'POST', url: '/tweets', payload: { text: '   ' } });
    expect(res.statusCode).toBe(400);
    const body = res.json() as any;
    expect(body.message).toBeDefined();
  });

  it('returns 400 when text exceeds 280 characters', async () => {
    const app = createServer({ twitter });
    const long = 'a'.repeat(281);
    const res = await app.inject({ method: 'POST', url: '/tweets', payload: { text: long } });
    expect(res.statusCode).toBe(400);
  });

  it('POST /tweets/agent generates and posts a tweet (dryRun=false)', async () => {
    const calls: string[] = [];
    twitter = {
      async postTweet(text: string): Promise<Tweet> {
        calls.push(text);
        return {
          id: '999',
          text,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          url: 'https://x.com/i/web/status/999',
        };
      },
    };
    const app = createServer({
      twitter,
      agentRun: async (input) => {
        const text = `AGENT:${input.topic}`;
        const posted = await twitter.postTweet(text);
        return { generatedText: text, posted: { id: posted.id, url: posted.url } } as any;
      },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/tweets/agent',
      payload: { topic: 'New feature', style: 'tech', includeHashtags: false, dryRun: false },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json() as any;
    expect(body.generatedText).toBeTypeOf('string');
    expect(body.generatedText.length).toBeGreaterThan(0);
    expect(body.posted?.id).toBe('999');
    expect(calls.length).toBe(1);
  });

  it('POST /tweets/agent with dryRun=true does not post', async () => {
    const calls: string[] = [];
    twitter = {
      async postTweet(text: string): Promise<Tweet> {
        calls.push(text);
        return {
          id: '111',
          text,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          url: 'https://x.com/i/web/status/111',
        };
      },
    };
    const app = createServer({
      twitter,
      agentRun: async (input) => {
        return { generatedText: `AGENT:${input.topic}` } as any;
      },
    });
    const res = await app.inject({
      method: 'POST',
      url: '/tweets/agent',
      payload: { topic: 'Docs update', dryRun: true },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as any;
    expect(body.generatedText).toBeTypeOf('string');
    expect(body.posted).toBeUndefined();
    expect(calls.length).toBe(0);
  });
});
