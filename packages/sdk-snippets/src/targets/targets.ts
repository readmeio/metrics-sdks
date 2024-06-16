import type { CodeBuilder } from '../helpers/code-builder.js';
import type { SecurityVariable, ServerVariable } from '../index.js';
import type { Merge } from 'type-fest';

import { csharp } from './csharp/target.js';
import { node } from './node/target.js';
import { php } from './php/target.js';
import { python } from './python/target.js';
import { ruby } from './ruby/target.js';

export type TargetId = keyof typeof targets;
export type SnippetType = 'server' | 'webhooks';
export type ClientId = string;

export interface ClientInfo {
  description: string;
  key: ClientId;
  link: string;
  metadata?: {
    lambdaRuntime?: string;
  };
  title: string;
}

export interface ClientRanges {
  sections: {
    payload?: {
      end: number;
      start: number;
    };
    verification?: {
      end: number;
      start: number;
    };
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
  options?: Merge<CodeBuilder, T>,
) => {
  ranges: ClientRanges;
  snippet: string;
};

export interface Client<T extends Record<string, any> = Record<string, any>> {
  convert: Converter<T>;
  info: ClientInfo;
}

export type Extension = `.${string}` | null;

export interface TargetInfo {
  cli?: string;
  default: string;
  extname: Extension;
  key: TargetId;
  title: string;
}

export interface Target {
  info: TargetInfo;
  services: {
    server: Record<ClientId, Client>;
    webhooks: Record<ClientId, Client>;
  };
}

export const targets = {
  csharp,
  node,
  php,
  python,
  ruby,
};
