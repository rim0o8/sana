/*
  Minimal Mastra-based agent that generates a tweet and posts it via a tool.
  Note: Mastra API surface may evolve; adjust model config as needed.
*/
import { PostTweetUseCase } from '../../application/usecases/PostTweetUseCase';
import type { ITwitterClient } from '../../domain/repositories/TwitterClient';
import type { Logger } from '../logging/logger';

export type TweetAgentInput = {
  topic: string;
  style?: 'informative' | 'casual' | 'tech' | 'marketing';
  includeHashtags?: boolean;
  maxChars?: number; // default 240 to leave room for links
  dryRun?: boolean; // if true, do not post
};

export type TweetAgentResult = {
  generatedText: string;
  posted?: { id: string; url?: string };
};

export function buildTweetAgent(deps: {
  twitter: ITwitterClient;
  logger: Logger;
  openaiApiKey?: string;
}) {
  const postTweetUseCase = new PostTweetUseCase(deps.twitter);
  let agent: any = null;

  const run = async (input: TweetAgentInput): Promise<TweetAgentResult> => {
    const maxChars = input.maxChars ?? 240;
    const hashtags = input.includeHashtags
      ? 'Include at most 2 relevant hashtags.'
      : 'Avoid hashtags.';
    const style = input.style ? `Style: ${input.style}.` : '';

    const prompt =
      `Topic: ${input.topic}. Write a single tweet under ${maxChars} chars. ${hashtags} ${style}`.trim();
    deps.logger.info({ prompt }, 'Generating tweet');

    // Mastra agent output shape can vary; normalize to string
    let generated = '';
    if (!agent) {
      const { Agent } = await import('@mastra/core/agent');
      const { openai } = await import('@ai-sdk/openai');
      agent = new Agent({
        name: 'Tweety',
        instructions: [
          'You are an expert social media copywriter.',
          'Write concise, engaging tweets that fit in 280 characters.',
          'Prefer clear language; avoid hashtags unless asked.',
          'If a call-to-action makes sense, add one short CTA.',
          'Do not include backticks or quotes around the tweet.',
        ].join(' '),
        model: openai('gpt-4o-mini'),
      });
    }
    let raw: any;
    try {
      raw = await (agent as any).generate?.(prompt);
    } catch (e: any) {
      // Surface a clearer error if input shape was wrong
      if (typeof e?.message === 'string' && /messages\.map is not a function/i.test(e.message)) {
        throw new Error(
          'Agent.generate failed: invalid messages parameter shape. This is a bug in our agent wrapper.'
        );
      }
      throw e;
    }
    generated = normalizeAgentOutput(raw).trim();
    const text = generated;

    deps.logger.info({ text, length: text.length }, 'Generated tweet');

    if (input.dryRun) return { generatedText: text };

    const posted = await postTweetUseCase.execute(text);
    return { generatedText: text, posted: { id: posted.id, url: posted.url } };
  };

  return { agent, run };
}

function normalizeAgentOutput(raw: any): string {
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw.text === 'string') return raw.text;
  if (typeof raw.outputText === 'string') return raw.outputText;
  if (Array.isArray(raw.messages)) {
    const last = raw.messages[raw.messages.length - 1];
    if (last && typeof last.content === 'string') return last.content;
  }
  return String(raw);
}

// Removed offline naive generator to enforce real agent generation
