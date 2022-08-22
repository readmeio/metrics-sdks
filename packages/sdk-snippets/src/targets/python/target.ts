import type { Target } from '../targets';

import { flask } from './flask/webhooks/client';

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
    },
  },
};
