import type { Logger as PinoLogger } from 'pino';
import pino from 'pino';

export type Logger = PinoLogger;

export type LoggerOptions = {
  level?: string;
  name?: string;
};

export const createLogger = (opts: LoggerOptions = {}): Logger => {
  const logger = pino({
    name: opts.name ?? 'app',
    level: opts.level ?? process.env.LOG_LEVEL ?? 'info',
    transport:
      process.env.NODE_ENV === 'production'
        ? undefined
        : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } },
  });
  return logger;
};

export const withChild = (logger: Logger, bindings: Record<string, unknown>): Logger =>
  logger.child(bindings);
