import { getProjectBaseUrl } from './lib/get-project-base-url';
import { log } from './lib/log';
import verifyWebhook from './lib/verify-webhook';

function readme(apiKey) {
  return userFunction => {
    return async (req, res, next) => {
      const user = await userFunction(req, res);
      if (req.path === '/readme-webhook') {
        try {
          // TODO: This needs to use jwt secret right now, we should probably consolidate
          verifyWebhook(req.body, req.headers['x-readme-signature'], apiKey);
        } catch (e) {
          return res.status(401).send(e.message);
        }
        res.send(user);
      } else {
        // TODO: need to pass in options instead of just the user object
        log(apiKey, req, res, user);
        next();
      }
    };
  };
}

export = apiKey => {
  return readme(apiKey);
};
