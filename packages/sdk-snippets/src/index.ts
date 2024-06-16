import type { ClientId, SnippetType, TargetId } from './targets/targets';

import { targets } from './targets/targets';

export { availableServerTargets, availableWebhookTargets, extname } from './helpers/utils';

export interface ServerVariable {
  default?: string;
  name: string;
  source: 'server';
}

export interface SecurityVariable {
  default?: string;
  name: string;
  scheme?: 'basic' | 'bearer';
  source: 'security';
  type: 'apiKey' | 'http' | 'oauth';
}

export type Variables = (SecurityVariable | ServerVariable)[];

export class MetricsSDKSnippet {
  secret: string;

  variables: Variables = [];

  constructor(
    input: Variables,
    data: {
      secret?: string;
    } = {},
  ) {
    this.variables = input;
    this.secret = data.secret ?? 'my-readme-secret';
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
      { server: [], security: [] },
    );

    return convert({ secret: this.secret, server, security }, options);
  };
}
