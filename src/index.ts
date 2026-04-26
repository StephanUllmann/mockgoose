import { access, mkdir, readFile, readdir } from 'fs/promises';
import type mongoose from 'mongoose';
import { DBState } from './types/index.js';
import Model from './lib/Model.js';
import Schema from './lib/Schema.js';
import path from 'path';
import syncToDisk from './lib/utils/syncToDisk.js';

let dbState: DBState = {};

const cwd = process.cwd();
const dirpath = path.join(cwd, '.mockgoose');

async function connect(
  uri: string,
  options?: mongoose.ConnectOptions | undefined
): Promise<mongoose.Mongoose> {
  try {
    await access(dirpath);

    const files = await readdir(dirpath);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const modelName = path.basename(file, '.json');
        const content = await readFile(path.join(dirpath, file), 'utf-8');
        dbState[modelName] = JSON.parse(content);
      }
    }
  } catch {
    await mkdir(dirpath, { recursive: true });
    dbState = {};
  }

  return { connection: { name: 'Mock DB' } } as mongoose.Mongoose;
}

function model(name: string, schema?: any) {
  let collection: Record<string, any>;

  if (name in dbState) {
    collection = dbState[name];
  } else {
    collection = {};
    dbState[name] = collection;

    syncToDisk(path.join(dirpath, `${name}.json`), collection);
  }

  const modelFilepath = path.join(dirpath, `${name}.json`);

  return new Model(schema, name, collection, dbState, async () => {
    await syncToDisk(modelFilepath, collection);
  });
}

export { connect, Model, model, Schema };
export default { connect, Model, model, Schema };
