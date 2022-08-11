import type { Variables } from '.';

import serverVariables from './fixtures/webhooks/server-variables';

import { MetricsSDKSnippet } from '.';

describe('MetricsSDKSnippet', () => {
  it('should return false if no matching target', () => {
    const snippet = new MetricsSDKSnippet(serverVariables as Variables);
    const result = snippet.convert('webhooks', null);

    expect(result).toBe(false);
  });
});
