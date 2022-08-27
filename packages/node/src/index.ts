import verifyWebhook from './lib/verify-webhook';

/**
 * @deprecated use expressMiddleware instead
 */
export { expressMiddleware as metrics } from './lib/express-middleware';
export { expressMiddleware } from './lib/express-middleware';
export { log } from './lib/metrics-log';
export { verifyWebhook };
