import { describe, expect, it, vi, beforeEach } from 'vitest';

import { type LoggerStrategy, type Log, type ErrorLog, logger } from '../../src/lib/logger';

export class MockLoggerStrategy implements LoggerStrategy {
  debug = vi.fn();

  verbose = vi.fn();

  info = vi.fn();

  error = vi.fn();
}

describe('Default Logger', () => {
  let mockStrategy: LoggerStrategy;

  beforeEach(() => {
    mockStrategy = new MockLoggerStrategy();
    logger.configure({ isLoggingEnabled: true, strategy: mockStrategy });
  });

  describe('trace', () => {
    it('should log trace messages when logging is enabled', () => {
      const log: Log = { message: 'Trace test message.' };
      logger.verbose(log);
      expect(mockStrategy.verbose).toHaveBeenCalledWith(log);
    });

    it('should not log trace messages when logging is disabled', () => {
      const log: Log = { message: 'Trace test message.' };
      logger.configure({ isLoggingEnabled: false });
      logger.verbose(log);
      expect(mockStrategy.verbose).not.toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should log debug messages when logging is enabled', () => {
      const log: Log = { message: 'Debug test message.' };
      logger.debug(log);
      expect(mockStrategy.debug).toHaveBeenCalledWith(log);
    });

    it('should not log debug messages when logging is disabled', () => {
      const log: Log = { message: 'Debug test message.' };
      logger.configure({ isLoggingEnabled: false });
      logger.debug(log);
      expect(mockStrategy.debug).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error messages when logging is enabled', () => {
      const log: ErrorLog = { message: 'Error test message.', err: new Error('Test error') };
      logger.error(log);
      expect(mockStrategy.error).toHaveBeenCalledWith(log);
    });

    it('should not log error messages when logging is disabled', () => {
      const log: ErrorLog = { message: 'Error test message.', err: new Error('Test error') };
      logger.configure({ isLoggingEnabled: false });
      logger.error(log);
      expect(mockStrategy.error).not.toHaveBeenCalled();
    });
  });
});
