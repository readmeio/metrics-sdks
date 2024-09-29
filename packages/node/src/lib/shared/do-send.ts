// import type { OutgoingLogBody } from './metrics-log';
// import type { Options } from './options';

// import { logger } from './logger';
// import { metricsAPICall } from './metrics-log';

// // eslint-disable-next-line import/no-mutable-exports
// export let queue: OutgoingLogBody[] = [];

// export function doSend(readmeApiKey: string, options: Options) {
//   console.log(options);
//   // Copy the queue so we can send all the requests in one batch
//   const json = [...queue];
//   // Clear out the queue so we don't resend any data in the future
//   queue = [];

//   // Make the log call
//   metricsAPICall(readmeApiKey, json, options).catch(err => {
//     // Silently discard errors and timeouts.
//     if (options.development) {
//       logger.error({ message: 'Failed to capture API request.', err });
//     }
//   });

//   logger.debug({ message: 'Queue flushed.', args: { queue } });
// }
