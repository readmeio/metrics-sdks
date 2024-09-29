import ssri from 'ssri';

/**
 * This will generate an integrity hash that looks something like this:
 *
 * sha512-Naxska/M1INY/thefLQ49sExJ8E+89Q2bz/nC4Pet52iSRPtI9w3Cyg0QdZExt0uUbbnfMJZ0qTabiLJxw6Wrg==?1345
 *
 * With the last 4 digits on the end for us to use to identify it later in a list.
 */
export function mask(apiKey: string) {
  return ssri
    .fromData(apiKey, {
      algorithms: ['sha512'],
      options: [apiKey.slice(-4)],
    })
    .toString();
}
