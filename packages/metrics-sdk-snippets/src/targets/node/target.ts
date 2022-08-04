import type { Target } from '../targets';
import { express } from './express/client';

export const node: Target = {
  info: {
    key: 'node',
    title: 'Node.js',
    extname: '.js',
    default: 'native',
    cli: 'node %s',
  },
  clientsById: {
    express,
  },
};
