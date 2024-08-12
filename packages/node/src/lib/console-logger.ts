import type { Log, ErrorLog, LoggerStrategy } from './logger';

/**
 * Implementation of the console logger strategy.
 */
export default class ConsoleLogger implements LoggerStrategy {
  /**
   * This method takes a level of the log and a message and formats it to the unified log format
   * @returns A formatted log message
   */
  // eslint-disable-next-line class-methods-use-this
  private formatMessage(level: 'DEBUG' | 'ERROR' | 'TRACE', message: string): string[] {
    return [`${level} ${new Date().toISOString()} [readmeio] ${message}`];
  }

  /**
   * Logs a trace message to the console.
   * @param log The trace log entry. Contains the message as required field and optional args.
   */
  trace({ message, args }: Log): void {
    const params: unknown[] = this.formatMessage('TRACE', message);
    console.trace(...params);
    if (args) {
      console.dir(args, { depth: null });
      console.log('\n');
    }
  }

  /**
   * Logs a debug message to the console.
   * @param log The debug log entry. Contains the message as required field and optional args.
   */
  debug({ message, args }: Log): void {
    const params: unknown[] = this.formatMessage('DEBUG', message);
    if (args) {
      params.push('\nArguments:', args);
    }
    console.debug(...params, '\n');
  }

  /**
   * Logs an error message to the console.
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
    console.error(...params, '\n');
  }
}
