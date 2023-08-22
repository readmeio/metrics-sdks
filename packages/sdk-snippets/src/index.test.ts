import type { Variables } from '.';

import { describe, it, expect } from 'vitest';

import serverVariables from './fixtures/webhooks/server-variables';

import { MetricsSDKSnippet } from '.';

describe('MetricsSDKSnippet', function () {
  it('should return false if no matching target', function () {
    const snippet = new MetricsSDKSnippet(serverVariables as Variables);
    const result = snippet.convert('webhooks', null);

    expect(result).toBe(false);
  });
});
