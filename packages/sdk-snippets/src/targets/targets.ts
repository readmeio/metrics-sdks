import type { Merge } from 'type-fest';
import type { CodeBuilderOptions } from '@readme/httpsnippet/dist/helpers/code-builder';
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

export type Converter<T extends Record<string, any>> = (
  params: {
    security: SecurityParameter[];
    server: ServerParameter[];
  },
  options?: Merge<CodeBuilderOptions, T>
) => string;

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
    webhooks?: {
      clientsById: Record<ClientId, Client>;
    };
    server?: {
      clientsById: Record<ClientId, Client>;
    };
  };
}

export const targets = {
  node,
};
