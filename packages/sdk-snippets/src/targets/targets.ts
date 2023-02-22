import type { SecurityVariable, ServerVariable } from '..';
import type { CodeBuilder } from '../helpers/code-builder';
import type { Merge } from 'type-fest';

import { csharp } from './csharp/target';
import { node } from './node/target';
import { php } from './php/target';
import { python } from './python/target';
import { ruby } from './ruby/target';

export type TargetId = keyof typeof targets;
export type SnippetType = 'webhooks' | 'server';
export type ClientId = string;

export interface ClientInfo {
  key: ClientId;
  title: string;
  link: string;
  description: string;
  metadata?: {
    lambdaRuntime?: string;
  };
}

export interface ClientRanges {
  sections: {
    payload?: { start: number; end: number };
    verification?: { start: number; end: number };
  };
  variables: {
    security?: Record<string, { line: number }>;
    server?: Record<string, { line: number }>;
  };
}

export type Converter<T extends Record<string, any>> = (
  params: {
    secret?: string;
    security: SecurityVariable[];
    server: ServerVariable[];
  },
  options?: Merge<CodeBuilder, T>
) => {
  ranges: ClientRanges;
  snippet: string;
};

export interface Client<T extends Record<string, any> = Record<string, any>> {
  info: ClientInfo;
  convert: Converter<T>;
}

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
  ruby,
};
