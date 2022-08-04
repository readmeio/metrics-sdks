import type { Parameters } from '..';
import type { ClientId, TargetId } from './targets';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

import { availableTargets, extname } from '../helpers/utils';
import { MetricsSDKSnippet } from '..';

const expectedBasePath = ['src', 'fixtures', 'parameters'];

const inputFileNames = readdirSync(path.join(...expectedBasePath), 'utf-8');

const fixtures: [string, Parameters][] = inputFileNames.map(inputFileName => [
  inputFileName.replace(path.extname(inputFileName), ''),
  // eslint-disable-next-line import/no-dynamic-require, global-require
  require(path.resolve(...expectedBasePath, inputFileName)),
]);

/** useful for debuggin, only run a particular set of targets */
const targetFilter: TargetId[] = [
  // put your targetId:
  // 'node',
];

/** useful for debuggin, only run a particular set of targets */
const clientFilter: ClientId[] = [
  // put your clientId here:
  // 'express',
];

/** useful for debuggin, only run a particular set of fixtures */
const fixtureFilter: string[] = [
  // put the name of the fixture file you want to isolate (excluding `.js`):
  // 'security-variables',
];

/**
 * This is useful when you want to make a change and overwrite it for every fixture.
 * Basically a snapshot reset.
 *
 * Switch to `true` in debug mode to put into effect.
 */
const OVERWRITE_EVERYTHING = Boolean(process.env.OVERWRITE_EVERYTHING) || false;

const testFilter =
  <T>(property: keyof T, list: T[keyof T][]) =>
  (item: T) =>
    list.length > 0 ? list.includes(item[property]) : true;

availableTargets()
  .filter(testFilter('key', targetFilter))
  .forEach(({ key: targetId, title, extname: fixtureExtension, clients }) => {
    describe(`${title} snippet generation`, () => {
      clients.filter(testFilter('key', clientFilter)).forEach(({ key: clientId }) => {
        fixtures.filter(testFilter(0, fixtureFilter)).forEach(([fixture, parameters]) => {
          const expectedPath = path.join(
            'src',
            'targets',
            targetId,
            clientId,
            'fixtures',
            `${fixture}${extname(targetId)}`
          );

          let expected: string;
          try {
            expected = readFileSync(expectedPath).toString();
          } catch (err) {
            throw new Error(
              `Missing a test file for ${targetId}:${clientId} for the ${fixture} fixture.\nExpected to find the output fixture: \`/src/targets/${targetId}/${clientId}/fixtures/${fixture}${
                fixtureExtension ?? ''
              }\``
            );
          }

          const { convert } = new MetricsSDKSnippet(parameters);
          const result = convert(targetId, clientId);

          if (OVERWRITE_EVERYTHING && result) {
            writeFileSync(expectedPath, String(result));
            return;
          }

          it(`${clientId} request should match fixture for "${fixture}.js"`, () => {
            expect(result).toStrictEqual(expected);
          });
        });
      });
    });
  });
