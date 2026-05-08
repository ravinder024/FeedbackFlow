/**
 * Simple dev runner to POST to /api/dev/seed-test-events
 * Windows-friendly: uses Node's http/https instead of node-fetch so it works
 * reliably when invoked from PowerShell.
 */

import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

function postJson(targetUrl: string, payload: any): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    try {
      const url = new URL(targetUrl);
      const data = JSON.stringify(payload);
      const isHttps = url.protocol === 'https:';
      const options: any = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + (url.search || ''),
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const req = (isHttps ? https : http).request(options, (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let parsed: any = body;
          try {
            parsed = JSON.parse(body);
          } catch (_) {}
          resolve({ status: res.statusCode || 0, body: parsed });
        });
      });

      req.on('error', (err) => reject(err));
      req.write(data);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function main() {
  const endpoint = process.env.SEED_ENDPOINT || 'http://localhost:3000/api/dev/seed-test-events';
  const testGroupId = process.env.SAUCEDEMO_TESTGROUP || '<put-your-testgroup-id-here>';
  const payload = {
    testGroupId,
    url: 'https://www.saucedemo.com/',
    users: 5,
    pinsPerUser: 4,
    seed: true,
  };

  console.log('Seeding:', endpoint, payload);
  try {
    const resp = await postJson(endpoint, payload);
    console.log('Seed response status:', resp.status);
    console.log('Seed response body:', JSON.stringify(resp.body, null, 2));
  } catch (err) {
    console.error('Failed to seed:', err);
  }
}

main();