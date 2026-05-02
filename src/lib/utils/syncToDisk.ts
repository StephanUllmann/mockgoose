import type { PathLike } from 'fs';
import { writeFile } from 'fs/promises';
import { DBState } from '../../types/index.js';

/**
 * Syncs the given database state to a file on disk.
 * 
 * @param filepath - The path to the file to write to.
 * @param dbState - The database state to sync.
 * @returns A promise that resolves when the sync is complete.
 */
export default async function syncToDisk(filepath: PathLike, dbState: DBState) {
  await writeFile(filepath, JSON.stringify(dbState, null, 2), 'utf-8');
}
