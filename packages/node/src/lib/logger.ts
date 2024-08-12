import ConsoleLogger from './console-logger';

interface LoggerConfig {
  isLoggingEnabled: boolean;
  strategy: LoggerStrategy;
}

export interface Log {
  args?: Record<string, unknown>;
  message: string;
}

export type ErrorLog = Log & { err?: Error };

export interface LoggerStrategy {
  debug(log: Log): void;
  error(log: ErrorLog): void;
  trace(log: Log): void;
}

export interface Logger extends LoggerStrategy {
  configure(config: Partial<LoggerConfig>): void;
}

/**
 * Default implementation of the Logger interface. Represents a signleton class of logger with selected strategy.
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
        strategy: new ConsoleLogger(),
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
   * Logs an error message.
   * @param log The error log entry. Contains the message and error object as required fields and optional args.
   */
  error(log: ErrorLog): void {
    if (!this.config.isLoggingEnabled) return;
    this.config.strategy.error(log);
  }

  /**
   * Logs a debug message.
   * @param log The debug log entry. Contains the message as required field and optional args.
   */
  debug(log: Log): void {
    if (!this.config.isLoggingEnabled) return;
    this.config.strategy.debug(log);
  }

  /**
   * Logs a trace message.
   * @param log The trace log entry. Contains the message as required field and optional args.
   */
  trace(log: Log): void {
    if (!this.config.isLoggingEnabled) return;
    this.config.strategy.trace(log);
  }
}

export const logger = DefaultLogger.getInstance();
