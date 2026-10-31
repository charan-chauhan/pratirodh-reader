import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import nextEnv from '@next/env';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const standalone = join(root, '.next/standalone');
if (!existsSync(join(standalone, 'server.js'))) {
  console.error('Build the application first with npm run build.');
  process.exit(1);
}
nextEnv.loadEnvConfig(root, false);
mkdirSync(join(standalone, '.next'), { recursive: true });
cpSync(join(root, 'public'), join(standalone, 'public'), { recursive: true });
cpSync(join(root, '.next/static'), join(standalone, '.next/static'), { recursive: true });
// Keep the public CMS data fetched by the build available to the local preview.
const buildDataCache = join(root, '.next/cache/fetch-cache');
if (existsSync(buildDataCache)) cpSync(buildDataCache, join(standalone, '.next/cache/fetch-cache'), { recursive: true, preserveTimestamps: true });
process.env.HOSTNAME = process.env.PORT ? '0.0.0.0' : '127.0.0.1';
process.env.PORT ||= '3000';
await import(pathToFileURL(join(standalone, 'server.js')).href);
