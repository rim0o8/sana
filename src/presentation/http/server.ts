import Fastify from 'fastify';
import { z } from 'zod';
import { PostTweetUseCase } from '../../application/usecases/PostTweetUseCase';
import type { ITwitterClient } from '../../domain/repositories/TwitterClient';
import {
  buildTweetAgent,
  type TweetAgentInput,
  type TweetAgentResult,
} from '../../infrastructure/ai/agent';
import { createLogger } from '../../infrastructure/logging/logger';

type Dependencies = {
  twitter: ITwitterClient;
  agentRun?: (input: TweetAgentInput) => Promise<TweetAgentResult>;
};

export function createServer(deps: Dependencies) {
  const app = Fastify({ logger: false });

  const bodySchema = z.object({ text: z.string() });
  const usecase = new PostTweetUseCase(deps.twitter);

  app.post('/tweets', async (request, reply) => {
    const parsed = bodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: 'Invalid body' });
    }
    try {
      const tweet = await usecase.execute(parsed.data.text);
      return reply.code(201).send(tweet);
    } catch (err: any) {
      return reply.code(400).send({ message: err?.message ?? 'Bad Request' });
    }
  });

  // Agent-driven tweet generation and (optionally) posting
  const agentInputSchema = z.object({
    topic: z.string(),
    style: z.enum(['informative', 'casual', 'tech', 'marketing']).optional(),
    includeHashtags: z.boolean().optional(),
    maxChars: z.number().int().positive().optional(),
    dryRun: z.boolean().optional(),
  });
  const logger = createLogger({ name: 'http-agent' });
  const agentRun =
    deps.agentRun ??
    buildTweetAgent({
      twitter: deps.twitter,
      logger,
      openaiApiKey: process.env.OPENAI_API_KEY,
    }).run;

  app.post('/tweets/agent', async (request, reply) => {
    const parsed = agentInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ message: 'Invalid body' });
    }
    try {
      const result = await agentRun(parsed.data as any);
      const status = parsed.data.dryRun ? 200 : 201;
      return reply.code(status).send(result);
    } catch (err: any) {
      const message = err?.message ?? 'Bad Request';
      const code = /OPENAI_API_KEY|model|Agent/i.test(message) ? 503 : 400;
      return reply.code(code).send({ message });
    }
  });

  return app;
}
