import type { Parameters } from '..';
import type { ClientId, SnippetType, TargetId } from './targets';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

import { availableWebhookTargets, extname } from '../helpers/utils';
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

availableWebhookTargets()
  .filter(testFilter('key', targetFilter))
  .forEach(({ key: targetId, title, clients }) => {
    const snippetType: SnippetType = 'webhooks';

    describe(`${title} snippet generation`, () => {
      clients.filter(testFilter('key', clientFilter)).forEach(({ key: clientId }) => {
        const fixtureBasePath = path.join('src', 'targets', targetId, clientId, snippetType, 'fixtures');

        fixtures.filter(testFilter(0, fixtureFilter)).forEach(([fixture, parameters]) => {
          const outputPath = path.join(fixtureBasePath, fixture, `output${extname(targetId)}`);
          const rangesPath = path.join(fixtureBasePath, fixture, 'ranges.json');

          let expectedOutput: string;
          try {
            expectedOutput = readFileSync(outputPath).toString();
          } catch (err) {
            throw new Error(
              `Missing a ${snippetType} test file for ${targetId}:${clientId} for the ${fixture} fixture.\nExpected to find the output fixture: \`/${outputPath}\``
            );
          }

          let expectedRanges: string;
          try {
            expectedRanges = readFileSync(rangesPath).toString();
            expectedRanges = JSON.parse(expectedRanges);
          } catch (err) {
            throw new Error(
              `Missing a ${snippetType} test file for ${targetId}:${clientId} for the ${fixture} fixture.\nExpected to find the output ranges fixture: \`/${rangesPath}\``
            );
          }

          const { convert } = new MetricsSDKSnippet(parameters);
          const result = convert(snippetType, targetId, clientId);

          if (OVERWRITE_EVERYTHING && result) {
            writeFileSync(rangesPath, JSON.stringify(result.ranges, null, 2));
            writeFileSync(outputPath, String(result.snippet));
            return;
          }

          it(`${clientId} request should match fixture for "${fixture}"`, () => {
            // eslint-disable-next-line jest/no-if
            if (!result) {
              throw new Error(`Generated ${fixture} snippet for ${clientId} was \`false\``);
            }

            expect(result.ranges).toStrictEqual(expectedRanges);
            expect(result.snippet).toStrictEqual(expectedOutput);
          });
        });
      });
    });
  });
