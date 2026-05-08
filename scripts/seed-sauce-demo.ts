// Dev helper: POST to /api/dev/seed-test-events with example values
// Usage (dev):
//   $env:SAUCEDEMO_TESTGROUP = '<id>'; npx ts-node scripts/seed-sauce-demo.ts
// This script uses Node's built-in http/https modules so it runs on Node versions
// that don't provide global fetch and works reliably when invoked from PowerShell.

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
          } catch (_) {
            // ignore JSON parse errors
          }
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
  const payload = {
    testGroupId: process.env.SAUCEDEMO_TESTGROUP || '<your-demo-group-id>',
    url: 'https://www.saucedemo.com/',
    users: 5,
    pinsPerUser: 4,
    seed: true,
  };

  console.log('Posting seed request to', endpoint);
  try {
    const resp = await postJson(endpoint, payload);
    console.log('Response status:', resp.status);
    console.log('Response body:', JSON.stringify(resp.body, null, 2));
  } catch (err) {
    console.error('Failed to call seed endpoint:', err);
  }
}

main();
