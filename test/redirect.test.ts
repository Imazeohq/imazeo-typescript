import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { expect, it } from 'vitest';
import { Imazeo } from '../src/index.js';

async function listen(server: Server): Promise<string> {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test address');
  return `http://127.0.0.1:${address.port}`;
}

async function close(server: Server) {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

it('does not forward the project key across an HTTP redirect', async () => {
  let destinationRequests = 0;
  const destination = createServer((_request, response) => {
    destinationRequests++;
    response.end('{}');
  });
  const destinationUrl = await listen(destination);
  const origin = createServer((request, response) => {
    expect(request.headers['x-api-key']).toBe('secret-key');
    response.writeHead(307, { Location: destinationUrl });
    response.end();
  });
  const originUrl = await listen(origin);
  try {
    const client = new Imazeo({ apiKey: 'secret-key', baseUrl: originUrl });
    await expect(client.context.get()).rejects.toThrow();
    expect(destinationRequests).toBe(0);
  } finally {
    await close(origin);
    await close(destination);
  }
});
