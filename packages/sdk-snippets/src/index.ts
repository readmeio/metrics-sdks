import type { ClientId, SnippetType, TargetId } from './targets/targets';

import { targets } from './targets/targets';

export { availableServerTargets, availableWebhookTargets, extname } from './helpers/utils';

export interface ServerVariable {
  name: string;
  default?: string;
  source: 'server';
}

export interface SecurityVariable {
  name: string;
  default?: string;
  source: 'security';
  type: 'apiKey' | 'http' | 'oauth';
  scheme?: 'basic' | 'bearer';
}

export type Variables = (ServerVariable | SecurityVariable)[];

export class MetricsSDKSnippet {
  variables: Variables = [];

  constructor(input: Variables) {
    this.variables = input;
  }

  convert = (snippetType: SnippetType, targetId: TargetId, clientId?: ClientId, options?: any) => {
    if (!options && clientId) {
      // eslint-disable-next-line no-param-reassign
      options = clientId;
    }

    const target = targets[targetId];
    if (!target || !target.services.webhooks) {
      return false;
    }

    const { convert } = target.services[snippetType][clientId || target.info.default];

    // Reduce our variables into a set keyed by their type.
    const { server, security } = this.variables.reduce(
      (prev, next) => {
        prev[next.source].push(next);
        return prev;
      },
      { server: [], security: [] }
    );

    return convert({ server, security }, options);
  };
}
