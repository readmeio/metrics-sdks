import type { SecurityVariable, ServerVariable } from '..';

import { csharp } from './csharp/target';
import { node } from './node/target';
import { php } from './php/target';
import { python } from './python/target';

export type TargetId = keyof typeof targets;
export type SnippetType = 'webhooks' | 'server';
export type ClientId = string;

export interface ClientInfo {
  key: ClientId;
  title: string;
  link: string;
  description: string;
}

export interface ClientRanges {
  security?: Record<string, { line: number }>;
  server?: Record<string, { line: number }>;
}

export type Converter = (params: { secret?: string; security: SecurityVariable[]; server: ServerVariable[] }) => {
  ranges: ClientRanges;
  snippet: string;
};

export type Client = {
  info: ClientInfo;
  convert: Converter;
};

export type Extension = `.${string}` | null;

export interface TargetInfo {
  key: TargetId;
  title: string;
  extname: Extension;
  default: string;
  cli?: string;
}

export interface Target {
  info: TargetInfo;
  services: {
    webhooks: Record<ClientId, Client>;
    server: Record<ClientId, Client>;
  };
}

export const targets = {
  csharp,
  node,
  php,
  python,
};
