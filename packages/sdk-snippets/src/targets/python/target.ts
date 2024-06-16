import type { Target } from '../targets.js';

import { aws } from './aws/webhooks/client.js';
import { flask } from './flask/webhooks/client.js';

export const python: Target = {
  info: {
    key: 'python',
    title: 'Python',
    extname: '.py',
    default: 'flask',
    cli: 'python3 %s',
  },
  services: {
    server: {},
    webhooks: {
      flask,
      aws,
    },
  },
};
