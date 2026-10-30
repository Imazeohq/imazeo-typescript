import { readFile, writeFile } from 'node:fs/promises';
import { Imazeo } from '@imazeo/sdk';

async function main() {
  const apiKey = process.env.IMAZEO_API_KEY;
  if (!apiKey) throw new Error('Set IMAZEO_API_KEY');
  const inputPath = process.argv[2];
  if (!inputPath) throw new Error('Usage: node examples/upload-transform.mjs <image>');

  const client = new Imazeo({
    apiKey,
    baseUrl: process.env.IMAZEO_BASE_URL ?? 'http://localhost:3001',
    projectId: process.env.IMAZEO_PROJECT_ID,
  });

  const bytes = new Uint8Array(await readFile(inputPath));
  const image = await client.images.upload({
    data: bytes,
    filename: 'input.bin',
    contentType: 'application/octet-stream',
  });
  console.log('uploaded', image._id, image.metadata);

  const transformed = await client.transforms.create({
    imageId: image._id,
    mode: 'EPHEMERAL',
    transform: { width: 800, format: 'webp', quality: 80 },
  });
  await writeFile('out.webp', transformed.data);
  console.log('wrote out.webp', transformed.transformationId);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
