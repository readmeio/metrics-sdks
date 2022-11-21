import type { Target } from '../targets';

import { aws } from './aws/webhooks/client';
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
      aws,
      rails,
    },
  },
};
