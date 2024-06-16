import type { Variables } from './index.js';

import { describe, it, expect } from 'vitest';

import * as serverVariables from './fixtures/webhooks/server-variables.cjs';

import { MetricsSDKSnippet } from './index.js';

describe('MetricsSDKSnippet', () => {
  it('should return false if no matching target', () => {
    const snippet = new MetricsSDKSnippet(serverVariables as unknown as Variables);
    // @ts-expect-error Testing a mistyped target
    const result = snippet.convert('webhooks', null);

    expect(result).toBe(false);
  });
});
