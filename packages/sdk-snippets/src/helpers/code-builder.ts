import type { CodeBuilderOptions } from '@readme/httpsnippet/dist/helpers/code-builder';

import { CodeBuilder as HTTPSnippetCodeBuilder } from '@readme/httpsnippet/dist/helpers/code-builder';

export type { CodeBuilderOptions };

export class CodeBuilder extends HTTPSnippetCodeBuilder {
  variableRanges: {
    security?: Record<string, { line: number }>;
    server?: Record<string, { line: number }>;
  } = {};

  ranges = () => {
    return this.variableRanges;
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
    if (!this.variableRanges[opts.type]) {
      this.variableRanges[opts.type] = {};
    }

    this.variableRanges[opts.type][opts.name] = {
      line: this.code.length,
    };
  };
}
