import type { ErrorLog, Log } from 'src/lib/logger';

import { describe, beforeEach, afterEach, vi, expect, it } from 'vitest';

import ConsoleLogger from '../../src/lib/console-logger';

describe('ConsoleLogger', () => {
  let logger: ConsoleLogger;
  const isoDateRegex = '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z';

  beforeEach(() => {
    logger = new ConsoleLogger();
    // Mock console methods
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'dir').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original implementations
    vi.restoreAllMocks();
  });

  describe('verbose', () => {
    it('should format and log verbose messages correctly with args if provided', () => {
      const log: Log = { message: 'Verbose test message', args: { key: 'value' } };
      const expectedLevel = 'VERBOSE';

      logger.verbose(log);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(`${expectedLevel} ${isoDateRegex} \\[readmeio\\] ${log.message}$`),
      );
      expect(console.dir).toHaveBeenCalledWith(log.args, { depth: null });
    });

    it('should format and log verbose messages correctly without args if not provided', () => {
      const log: Log = { message: 'Verbose test message' };
      const expectedLevel = 'VERBOSE';

      logger.verbose(log);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(`${expectedLevel} ${isoDateRegex} \\[readmeio\\] ${log.message}$`),
      );
      expect(console.dir).not.toHaveBeenCalled();
    });
  });

  describe('debug', () => {
    it('should format and log debug messages correctly with args if provided', () => {
      const log: Log = { message: 'Debug test message', args: { key: 'value' } };
      const expectedLevel = 'DEBUG';

      logger.debug(log);

      expect(console.debug).toHaveBeenCalledWith(
        expect.stringMatching(`${expectedLevel} ${isoDateRegex} \\[readmeio\\] ${log.message}$`),
        '\nArguments:',
        log.args,
        '\n',
      );
    });

    it('should format and log debug messages correctly without args if not provided', () => {
      const log: Log = { message: 'Debug test message' };
      const expectedLevel = 'DEBUG';

      logger.debug(log);

      expect(console.debug).toHaveBeenCalledWith(
        expect.stringMatching(`${expectedLevel} ${isoDateRegex} \\[readmeio\\] ${log.message}$`),
        '\n',
      );
    });
  });

  describe('info', () => {
    it('should format and log info messages correctly with args if provided', () => {
      const log: Log = { message: 'Info test message', args: { key: 'value' } };
      const expectedLevel = 'INFO';

      logger.info(log);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(`${expectedLevel} ${isoDateRegex} \\[readmeio\\] ${log.message}$`),
        '\nArguments:',
        log.args,
        '\n',
      );
    });

    it('should format and log debug messages correctly without args if not provided', () => {
      const log: Log = { message: 'Info test message' };
      const expectedLevel = 'INFO';

      logger.info(log);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(`${expectedLevel} ${isoDateRegex} \\[readmeio\\] ${log.message}$`),
        '\n',
      );
    });
  });

  describe('error', () => {
    it('should format and log error messages correctly with args if provided', () => {
      const log: ErrorLog = { message: 'Error test message', args: { key: 'value' } };
      const expectedLevel = 'ERROR';

      logger.error(log);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(`${expectedLevel} ${isoDateRegex} \\[readmeio\\] ${log.message}$`),
        '\nArguments:',
        log.args,
        '\n',
      );
    });

    it('should format and log error messages correctly with error if provided', () => {
      const log: ErrorLog = { message: 'Error test message', err: new Error('Test error') };
      const expectedLevel = 'ERROR';

      logger.error(log);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(`${expectedLevel} ${isoDateRegex} \\[readmeio\\] ${log.message}$`),
        '\n',
        log.err,
        '\n',
      );
    });

    it('should format and log error messages correctly with error and args if provided', () => {
      const log: ErrorLog = { message: 'Error test message', err: new Error('Test error'), args: { key: 'value' } };

      logger.error(log);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(`ERROR ${isoDateRegex} \\[readmeio\\] ${log.message}$`),
        '\nArguments:',
        log.args,
        '\n',
        log.err,
        '\n',
      );
    });

    it('should format and log error messages correctly without error and args if not provided', () => {
      const log: ErrorLog = { message: 'Error test message' };

      logger.error(log);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(`ERROR ${isoDateRegex} \\[readmeio\\] ${log.message}$`),
        '\n',
      );
    });
  });
});
