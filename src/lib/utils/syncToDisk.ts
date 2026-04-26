import type { PathLike } from 'fs';
import { writeFile } from 'fs/promises';
import { DBState } from '../../types/index.js';

export default async function syncToDisk(filepath: PathLike, dbState: DBState) {
  await writeFile(filepath, JSON.stringify(dbState, null, 2), 'utf-8');
}
