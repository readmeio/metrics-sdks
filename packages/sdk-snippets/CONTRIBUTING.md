# Contributing

For general contributing and commit guidelines for this project check out https://github.com/readmeio/.github/blob/main/.github/CONTRIBUTING.md.

## Creating a new Target

Much like in [HTTPSnippet](https://npm.im/httpsnippet) targets are programming languages. If you wish to create a new snippet generator for a new language follow these steps:

1. Create a new directory in `src/targets/` and name it the language you're targeting. (eg. for PHP it'd be `php`, C# would be `csharp`, etc.).
2. Create a `target.ts` file in this new directory with code similar to the following:

```ts
import type { Target } from '../targets';
import { express } from './express/webhooks/client';

export const node: Target = {
  info: {
    // This should be identical to the directory you created.
    key: 'node',

    // The proper naming of this language.
    title: 'Node.js',

    // The file extension that this language prefers. If it doesn't have a file
    //  extension you can set this to an empty string.
    extname: '.js',

    // The default client this language will use. See below for instructions on
    // creating a client.
    default: 'native',

    // This is how you execute the code that it generates.
    cli: 'node %s',
  },
  services: {
    server: {},
    webhooks: {
      express, // The Client in question
    },
  },
};
```

3. Once you have a target created you need to let the library know it exists. You can do this by loading and exporting it within the `targets` const in `src/targets.ts`. See that file for some available examples.

## Creating a new Client

Clients are what _actually_ generate snippets. For Node, if you want to generate snippets for [Express](https://expressjs.com/) you would create an Express client. To create a new client for a target you created above, or for an existing target you need to do the following:

1. Determine what kind of client you're creating. Is it for Metrics SDK webhooks snippet or a Metrics SDK server?
2. Create a new directory in `src/targets/{TARGET}/` named after the client you're creating (i.e. Laravel would be `laravel`).
3. Create another sub directory within that for `webhooks` or `server`. If you're creating a client for both, create both.
4. Create a `client.ts` in the `webhooks` or `server` directory. This will be where you create your client.
   - See below for what this should look like.
5. Create a `fixtures` directory in this same directory. This will be where all of of the output fixtures and snapshots are placed and sourced from in unit tests.
6. Once you have your `client.ts` in place you need to update the target so it's aware. Load up the `target.ts` file for this target and add it to `services.server` or `services.webhooks`.

Once that's all done and your client is constructed you're ready to run unit tests.

```bash
npx vitest src/targets/targets.test.ts
```

- Running this on a brand new client will throw exceptions for missing fixture snapshots, add those to `src/targets/{TARGET}/{CLIENT}/{server|webhooks}/fixtures` as they come up.
- If you happen to make changes to your client and it breaks your fixture snapshots you can re-run Vitest with `OVERWRITE_EVERYTHING=true` update your fixtures.

```bash
OVERWRITE_EVERYTHING=true npx vitest src/targets/targets.test.ts
```

### `client.ts`

> ℹ️
>
> Consult the TS types for `CodeBuilder` to see how to use its offerings.

`client.ts` is where all of the snippet generation happens, this is an example of one:

```ts
import type { Client } from '../../../targets';
import { CodeBuilder } from '@readme/httpsnippet/dist/helpers/code-builder';

export const express: Client = {
  info: {
    key: 'express',
    title: 'Express',
    link: 'https://expressjs.com/',
    description: 'ReadMe Metrics Webhooks SDK usage on Express',
  },
  convert: ({ security, server }, options) => {
    const opts = {
      indent: '  ',
      ...options,
    };

    const { blank, join, push } = new CodeBuilder({ indent: opts.indent });

    push('// This is an example client snippet generator');

    return {
      ranges: ranges(),
      snippet: join(),
    };
  },
};
```
