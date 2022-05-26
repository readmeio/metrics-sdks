/**
 * @deprecated use expressMiddleware instead
 */

import { expressMiddleware } from './lib/log';

export { getProjectBaseUrl } from './lib/get-project-base-url';

export default { log: expressMiddleware };
