import type { ClientId, SnippetType, TargetId } from './targets/targets';

import { targets } from './targets/targets';

export { availableServerTargets, availableWebhookTargets, extname } from './helpers/utils';

export interface ServerParameter {
  name: string;
  default: string;
  source: 'server';
}

export interface SecurityParameter {
  name: string;
  default: string;
  source: 'security';
  type: string;
}

export type Parameters = (ServerParameter | SecurityParameter)[];

export class MetricsSDKSnippet {
  params: Parameters = [];

  constructor(input: Parameters) {
    this.params = input;
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

    // Reduce our parameters into a set keyed by their type.
    const { server, security } = this.params.reduce(
      (prev, next) => {
        prev[next.source].push(next);
        return prev;
      },
      { server: [], security: [] }
    );

    return convert({ server, security }, options);
  };
}
