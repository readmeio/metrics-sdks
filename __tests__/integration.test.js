import http from 'http';
import { cwd } from 'process';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { once } from 'events';

// https://gist.github.com/krnlde/797e5e0a6f12cc9bd563123756fc101f
http.get[promisify.custom] = function getAsync(options) {
  return new Promise((resolve, reject) => {
    http
      .get(options, response => {
        response.end = new Promise(resolve => response.on('end', resolve));
        resolve(response);
      })
      .on('error', reject);
  });
};

const get = promisify(http.get);

const randomApiKey = Math.random().toString(36).substring(2);

// TODO generate a random port number so we
// can parallelize these tests
const PORT = 4000;

describe('Metrics SDK Integration Tests', () => {
  let metricsServer;
  let httpServer;
  beforeAll(async () => {
    metricsServer = http.createServer().listen(0, '0.0.0.0');

    await once(metricsServer, 'listening');
    const { address, port } = metricsServer.address();

    httpServer = spawn('node', ['./packages/node/examples/express/index.js'], {
      cwd: cwd(),
      env: Object.assign(
        {
          PORT: PORT,
          METRICS_SERVER: new URL(`http://${address}:${port}`).toString(),
          README_API_KEY: randomApiKey,
        },
        process.env
      ),
    });
    httpServer.stderr.on('data', data => console.error(`stderr: ${data}`));
    httpServer.on('error', err => console.error('error', err));
    return new Promise(resolve => {
      httpServer.stdout.on('data', data => {
        if (data.toString().match(/app listening/)) return resolve();
        console.log(`stdout: ${data}`);
      });
    });
  });

  afterAll(() => {
    metricsServer.close();
    httpServer.kill();
  });

  it('should make a request to a metrics backend with a har file', async () => {
    const res = await get(`http://localhost:${PORT}`);

    const [req] = await once(metricsServer, 'request');
    expect(req.url).toBe('/v1/request');

    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    body = JSON.parse(body);
    const [har] = body;

    // Check for a uuid
    // https://uibakery.io/regex-library/uuid
    expect(har._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(har.group).toMatchSnapshot();
    expect(har.clientIPAddress).toBe('127.0.0.1');

    // Removing non-deterministic items from the snapshot so we can compare
    // https://jestjs.io/docs/snapshot-testing#2-tests-should-be-deterministic
    delete har.request.log.entries[0].startedDateTime;
    delete har.request.log.entries[0].time;
    delete har.request.log.entries[0].timings;

    expect(har.request.log.entries[0]).toMatchSnapshot();
  });
});
