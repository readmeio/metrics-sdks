import http from 'http';
import { cwd } from 'process';
import { spawn } from 'child_process';
import { promisify } from 'util';
import { once } from 'events';

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
const port = 4000;

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
          PORT: port,
          METRICS_SERVER: new URL('/v1/request', `http://${address}:${port}`).toString(),
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

  it('should make a request to a metrics backend with a har file', async done => {
    const res = await get(`http://localhost:${port}`);

    metricsServer.once('request', res => {
      expect(res.headers).toMatchInlineSnapshot();
      done();
    });
  });
});
