import type { Target } from '../targets';

import { net6 } from './net6.0/webhooks/client';

export const dotnet: Target = {
  info: {
    key: 'dotnet',
    title: '.NET',
    extname: '.cs',
    default: 'net6',
    cli: 'dotnet %s',
  },
  services: {
    server: {},
    webhooks: {
      net6,
    },
  },
};
