import type { ExtendedIncomingMessage, ExtendedResponse, Options } from './lib/log';
import type { GroupingObject } from './lib/metrics-log';
import type { WebhookBody } from './lib/verify-webhook';

import { getProjectBaseUrl } from './lib/get-project-base-url';
import { log } from './lib/log';
import verifyWebhook from './lib/verify-webhook';

class ReadMe {
  apiKey: string;

  config(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * This method will send supplied API requests to ReadMe Metrics.
   *
   * @see {@link https://readme.com/metrics}
   * @see {@link https://docs.readme.com/docs/sending-logs-to-readme-with-nodejs}
   * @param req This is your incoming request object from your HTTP server and/or framework.
   * @param res This is your outgoing response object for your HTTP server and/or framework.
   * @param group A function that helps translate incoming request data to our metrics grouping data.
   * @param options Additional options. See the documentation for more details.
   */
  log(req: ExtendedIncomingMessage, res: ExtendedResponse, group: GroupingObject, options: Options = {}) {
    return log(this.apiKey, req, res, group, options);
  }

  static verifyWebhook(body: WebhookBody, signature: string, secret: string): WebhookBody {
    return verifyWebhook(body, signature, secret);
  }
}

export { getProjectBaseUrl, ReadMe };

export default new ReadMe();
