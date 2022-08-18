import type { Target } from '../targets';

import { laravel } from './laravel/webhooks/client';

export const php: Target = {
  info: {
    key: 'php',
    title: 'PHP',
    extname: '.php',
    default: 'laravel',
    cli: 'php %s',
  },
  services: {
    server: {},
    webhooks: {
      laravel,
    },
  },
};
