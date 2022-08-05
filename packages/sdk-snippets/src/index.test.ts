import type { Parameters } from '.';

import serverVariables from './fixtures/parameters/server-variables';

import { MetricsSDKSnippet } from '.';

describe('MetricsSDKSnippet', () => {
  it('should return false if no matching target', () => {
    const snippet = new MetricsSDKSnippet(serverVariables as Parameters);
    const result = snippet.convert('webhooks', null);

    expect(result).toBe(false);
  });
});
