interface LoggerConfig {
  isLoggingEnabled: boolean;
  logPrefix: string;
}

interface Log {
  args?: Record<string, unknown>;
  message: string;
}

type ErrorLog = Log & { err?: Error };

export interface Logger {
  configure(config: Partial<LoggerConfig>): void;
  debug(log: Log): void;
  error(log: ErrorLog): void;
  trace(log: Log): void;
}

/**
 * Default implementation of the Logger interface. Represents a signleton class of console logger.
 */
class DefaultLogger implements Logger {
  private static instance: Logger;

  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  /**
   * Method for getting instance of the logger class
   * @returns A single instance of the logger
   */
  static getInstance(): Logger {
    if (!DefaultLogger.instance) {
      const defaultConfig: LoggerConfig = {
        isLoggingEnabled: false,
        logPrefix: '[readmeio]',
      };
      DefaultLogger.instance = new DefaultLogger(defaultConfig);
    }
    return DefaultLogger.instance;
  }

  /**
   * Updates the logger configuration dynamically
   * @param config - Partial configuration to be updated
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * This method takes a level of the log and a message and formats it to the unified log format
   * @returns A formatted log message
   */

  private formatMessage(level: 'DEBUG' | 'ERROR' | 'TRACE', message: string): string[] {
    return [`${level} ${new Date().toISOString()} ${this.config.logPrefix} ${message}`];
  }

  /**
   * Logs a trace message.
   * @param log The trace log entry. Contains the message as required field and optional args.
   */
  trace({ message, args }: Log): void {
    if (!this.config.isLoggingEnabled) return;
    const params: unknown[] = this.formatMessage('TRACE', message);
    console.log(...params);
    if (args) {
      console.dir(args, { depth: null });
      console.log('\n');
    }
  }

  /**
   * Logs a debug message.
   * @param log The debug log entry. Contains the message as required field and optional args.
   */
  debug({ message, args }: Log): void {
    if (!this.config.isLoggingEnabled) return;
    const params: unknown[] = this.formatMessage('DEBUG', message);
    if (args) {
      params.push('\nArguments:', args);
    }
    console.debug(...params, '\n');
  }

  /**
   * Logs an error message.
   * @param log The error log entry. Contains the message and error object as required fields and optional args.
   */
  error({ message, args, err }: ErrorLog): void {
    if (!this.config.isLoggingEnabled) return;
    const params: unknown[] = this.formatMessage('ERROR', message);
    if (args) {
      params.push('\nArguments:', args);
    }
    if (err) {
      params.push('\n', err);
    }
    console.error(...params, '\n');
  }
}

export const logger = DefaultLogger.getInstance();
