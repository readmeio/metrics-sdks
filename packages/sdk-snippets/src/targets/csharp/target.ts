import type { Target } from '../targets.js';

import { aws } from './aws/webhooks/client.js';
import { dotnet6 } from './dotnet6/webhooks/client.js';

export const csharp: Target = {
  info: {
    key: 'csharp',
    title: 'C#',
    extname: '.cs',
    default: 'dotnet6',
    cli: 'dotnet %s',
  },
  services: {
    server: {},
    webhooks: {
      aws,
      dotnet6,
    },
  },
};
