import { writeFile } from 'node:fs/promises';
import { Imazeo } from '@imazeo/sdk';

/**
 * Minimal server-side example.
 * Requires: IMAZEO_API_KEY, optional IMAZEO_BASE_URL, IMAZEO_PROJECT_ID
 */
async function main() {
  const apiKey = process.env.IMAZEO_API_KEY;
  if (!apiKey) throw new Error('Set IMAZEO_API_KEY');

  const client = new Imazeo({
    apiKey,
    baseUrl: process.env.IMAZEO_BASE_URL ?? 'https://api.imazeo.com',
    projectId: process.env.IMAZEO_PROJECT_ID,
  });

  const ctx = await client.context.get();
  console.log('project', ctx.projectId, 'env', ctx.environment);

  const qr = await client.qr.generate({
    content: 'https://imazeo.com',
    size: 256,
    format: 'png',
  });
  await writeFile('qr.png', qr.data);
  console.log('wrote qr.png', qr.contentType);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
