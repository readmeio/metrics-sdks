import type { Target } from '../targets.js';

import { aws } from './aws/webhooks/client.js';
import { express } from './express/webhooks/client.js';

export const node: Target = {
  info: {
    key: 'node',
    title: 'Node.js',
    extname: '.js',
    default: 'express',
    cli: 'node %s',
  },
  services: {
    server: {},
    webhooks: {
      express,
      aws,
    },
  },
};
