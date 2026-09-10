import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('contract/build');
const destination = resolve('public/zk-artifacts');

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await Promise.all([
  cp(resolve(source, 'keys'), resolve(destination, 'keys'), { recursive: true }),
  cp(resolve(source, 'zkir'), resolve(destination, 'zkir'), { recursive: true }),
]);
