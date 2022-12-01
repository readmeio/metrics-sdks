import type { Target } from '../targets';

import { aws } from './aws/webhooks/client';
import { dotnet6 } from './dotnet6/webhooks/client';

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
