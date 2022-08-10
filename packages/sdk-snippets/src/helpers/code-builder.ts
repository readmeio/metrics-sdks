import type { CodeBuilderOptions } from '@readme/httpsnippet/dist/helpers/code-builder';

import { CodeBuilder as HTTPSnippetCodeBuilder } from '@readme/httpsnippet/dist/helpers/code-builder';

export type { CodeBuilderOptions };

export class CodeBuilder extends HTTPSnippetCodeBuilder {
  variableRanges: {
    security?: Record<string, { line: number }>;
    server?: Record<string, { line: number }>;
  } = {};

  variable = (type: 'security' | 'server', name: string) => {
    if (!this.variableRanges[type]) {
      this.variableRanges[type] = {};
    }

    this.variableRanges[type][name] = {
      line: this.code.length,
    };
  };

  ranges = () => {
    return this.variableRanges;
  };
}
