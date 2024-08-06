interface Log {
  args?: Record<string, unknown>;
  message: string;
}

type ErrorLog = Log & { err: Error };

export interface Logger {
  debug(log: Log): void;
  error(log: ErrorLog): void;
  trace(log: Log): void;
}

/**
 * Default implementation of the Logger interface. Represents a signleton class of console logger.
 */
class DefaultLogger implements Logger {
  private static instance: Logger;

  /**
   * Method for getting instance of the logger class
   * @returns A single instance of the logger
   */
  static getInstance(): Logger {
    if (!DefaultLogger.instance) {
      DefaultLogger.instance = new DefaultLogger();
    }
    return DefaultLogger.instance;
  }

  /**
   * This method takes a level of the log and a message and formats it to the unified log format
   * @returns A formatted log message
   */
  // eslint-disable-next-line class-methods-use-this
  private formatMessage(level: 'DEBUG' | 'ERROR' | 'TRACE', message: string): string[] {
    return [`${level} ${new Date().toISOString()} [readmeio] ${message}`];
  }

  /**
   * Logs a trace message.
   * @param log The trace log entry. Contains the message as required field and optional args.
   */
  trace({ message, args }: Log): void {
    const params: unknown[] = this.formatMessage('TRACE', message);
    if (args) {
      params.push('\nArguments:', args);
    }
    console.debug(...params);
  }

  /**
   * Logs a debug message.
   * @param log The debug log entry. Contains the message as required field and optional args.
   */
  debug({ message, args }: Log): void {
    const params: unknown[] = this.formatMessage('DEBUG', message);
    if (args) {
      params.push('\nArguments:', args);
    }
    console.debug(...params);
  }

  /**
   * Logs an error message.
   * @param log The error log entry. Contains the message and error object as required fields and optional args.
   */
  error({ message, args, err }: ErrorLog): void {
    const params: unknown[] = this.formatMessage('ERROR', message);
    if (args) {
      params.push('\nArguments:', args);
    }
    if (err) {
      params.push('\n', err);
    }
    console.error(...params);
  }
}

export const logger = DefaultLogger.getInstance();
