import type { CodeBuilderOptions } from '@readme/httpsnippet/dist/helpers/code-builder';

import { CodeBuilder as HTTPSnippetCodeBuilder } from '@readme/httpsnippet/dist/helpers/code-builder';

export type { CodeBuilderOptions };

export class CodeBuilder extends HTTPSnippetCodeBuilder {
  sections: {
    payload?: { start: number; end: number };
    verification?: { start: number; end: number };
  } = {};

  variables: {
    security?: Record<string, { line: number }>;
    server?: Record<string, { line: number }>;
  } = {};

  startSection = (section: 'payload' | 'verification') => {
    this.sections[section] = {
      start: this.code.length + 1,
      end: 0,
    };
  };

  endSection = (section: 'payload' | 'verification') => {
    this.sections[section].end = this.code.length;
  };

  ranges = () => {
    return {
      sections: this.sections,
      variables: this.variables,
    };
  };

  /**
   * Push a dynamic piece of code to the snippet and record where in the snippet it was added.
   *
   */
  pushVariable = (
    line: string,
    opts: {
      name: string;
      indentationLevel?: number;
      type: 'security' | 'server';
    }
  ) => {
    this.push(line, opts.indentationLevel);

    // Record where in the snippet this variable is located.
    if (!this.variables[opts.type]) {
      this.variables[opts.type] = {};
    }

    this.variables[opts.type][opts.name] = {
      line: this.code.length,
    };
  };
}
