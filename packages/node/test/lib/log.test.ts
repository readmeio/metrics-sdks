import type { ExtendedIncomingMessage, ExtendedResponse } from 'src/lib/metrics-node/log';
import type { GroupingObject } from 'src/lib/shared/metrics-log';
import type { Options } from 'src/lib/shared/options';

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { log } from '../../src/lib/metrics-node/log';
import { metricsAPICall } from '../../src/lib/shared/metrics-log';

describe('log', function () {
  vi.mock('../../src/lib/shared/metrics-log');

  let req: ExtendedIncomingMessage;
  let res: ExtendedResponse;
  let group: GroupingObject;
  let options: Options;

  beforeEach(() => {
    req = {
      method: 'GET',
      headers: {},
      url: '/',
    } as ExtendedIncomingMessage;

    res = {
      statusCode: 200,
      getHeader: vi.fn(),
      setHeader: vi.fn(),
      removeListener: vi.fn(),
      once: vi.fn(),
    } as unknown as ExtendedResponse;

    group = { apiKey: 'test-api-key' };
    options = { bufferLength: 1 };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not log OPTIONS requests', function () {
    req.method = 'OPTIONS';
    const logId = log('api-key', req, res, group, options);
    expect(logId).toBeUndefined();
    expect(metricsAPICall).not.toHaveBeenCalled();
  });
});
