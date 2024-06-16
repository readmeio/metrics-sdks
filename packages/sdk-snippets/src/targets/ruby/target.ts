import type { Target } from '../targets.js';

import { aws } from './aws/webhooks/client.js';
import { rails } from './rails/webhooks/client.js';

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
      aws,
      rails,
    },
  },
};
