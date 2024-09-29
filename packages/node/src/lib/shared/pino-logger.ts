import type { ErrorLog, Log, LoggerStrategy } from './logger';

const customLogLevels = {
  debug: 10,
  info: 20,
  verbose: 30,
  error: 40,
};

interface PinoCustomLevelsLogger {
  debug: (obj: Record<string, unknown>, msg: string) => void;
  error: (obj: Record<string, unknown>, msg: string) => void;
  info: (obj: Record<string, unknown>, msg: string) => void;
  verbose: (obj: Record<string, unknown>, msg: string) => void;
}

/**
 * Implementation of the pino logger strategy.
 */
export default class PinoLogger implements LoggerStrategy {
  externalLogger?: PinoCustomLevelsLogger;

  constructor() {
    try {
      // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires, import/no-extraneous-dependencies
      this.externalLogger = require('pino')({
        customLevels: customLogLevels,
        level: 'debug',
        useOnlyCustomLevels: true,
        transport: {
          target: 'pino-pretty',
          options: {
            customLevels: Object.entries(customLogLevels)
              .map(([key, value]) => `${key}:${value}`)
              .join(','),
          },
        },
        formatters: {
          level: (label: string) => {
            return { level: label.toUpperCase() };
          },
        },
      });
    } catch (e) {
      throw new Error('Error creating a pino instance');
    }
  }

  debug({ args, message }: Log): void {
    this.externalLogger?.debug({ args }, message);
  }

  error({ args, message, err }: ErrorLog): void {
    this.externalLogger?.error({ args, err }, message);
  }

  info({ args, message }: Log): void {
    this.externalLogger?.info({ args }, message);
  }

  verbose({ args, message }: Log): void {
    this.externalLogger?.verbose({ args }, message);
  }
}
