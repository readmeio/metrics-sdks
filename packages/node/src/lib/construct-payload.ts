import url from 'url';
import processRequest, { RequestOptions } from './process-request';
import processResponse from './process-response';
import { name, version } from '../../package.json';
import { LogBody } from './metrics-log';

export interface GroupingObject {
  // @todo: document this
  apiKey: string;
  /**
   * @deprecated use apiKey instead
   */
  id: string;
  // @todo: document this
  label: string;
  // @todo: document this
  email: string;
}
export interface GroupingFunction {
  (req, res): GroupingObject;
}

export function constructPayload(
  req,
  res,
  groupingFn: GroupingFunction,
  options: RequestOptions,
  { logId, startedDateTime }
): LogBody {
  const group = groupingFn(req, res);

  // if apiKey is specified use it as if it were passed in as the id
  if (group && group.apiKey) {
    group.id = group.apiKey;
    delete group.apiKey;
  }

  return {
    _id: logId,
    group,
    clientIPAddress: req.ip,
    development: options.development,
    request: {
      log: {
        creator: { name, version, comment: `${process.platform}/${process.version}` },
        entries: [
          {
            pageref: req.route
              ? url.format({
                  protocol: req.protocol,
                  host: req.get('host'),
                  pathname: `${req.baseUrl}${req.route.path}`,
                })
              : '',
            startedDateTime: startedDateTime.toISOString(),
            time: new Date().getTime() - startedDateTime.getTime(),
            request: processRequest(req, options),
            response: processResponse(res, options),
          },
        ],
      },
    },
  };
}
