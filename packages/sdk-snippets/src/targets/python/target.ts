import type { Target } from '../targets';

import { aws } from './aws/webhooks/client';
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
      aws,
    },
  },
};
