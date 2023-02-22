import type { Target } from '../targets';

import { aws } from './aws/webhooks/client';
import { express } from './express/webhooks/client';

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
