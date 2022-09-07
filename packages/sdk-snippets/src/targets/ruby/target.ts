import type { Target } from '../targets';

import { rails } from './rails/webhooks/client';

export const ruby: Target = {
  info: {
    key: 'ruby',
    title: 'Ruby',
    extname: '.rb',
    default: 'rails',
    cli: 'ruby %s',
  },
  services: {
    server: {},
    webhooks: {
      rails,
    },
  },
};
