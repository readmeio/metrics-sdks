import type { Merge } from 'type-fest';
import type { CodeBuilder } from '../helpers/code-builder';

import type { SecurityParameter, ServerParameter } from '..';

import { node } from './node/target';

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

export type Converter<T extends Record<string, any>> = (
  params: {
    security: SecurityParameter[];
    server: ServerParameter[];
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
  node,
};
