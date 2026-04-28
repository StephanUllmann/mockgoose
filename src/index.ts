import { access, mkdir, readFile, readdir, rm } from 'fs/promises';
import type mongoose from 'mongoose';
import { DBState, MockgooseModel } from './types/index.js';
import Model from './lib/Model.js';
import Schema from './lib/Schema.js';
import path from 'path';
import syncToDisk from './lib/utils/syncToDisk.js';
import { accessSync, mkdirSync, readdirSync, readFileSync } from 'fs';

let dbState: DBState = {};

const cwd = process.cwd();
const dirpath = path.join(cwd, '.mockgoose');

let connection = {
  name: `Mock DB`,
  async dropDatabase() {
    rm(dirpath, { force: true, recursive: true });
  },
};

async function connect(
  uri: string,
  options?: mongoose.ConnectOptions | undefined
): Promise<mongoose.Mongoose> {
  if (!uri) throw new Error('Mockgoose Error: Missing connection sting');
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

  if (options?.dbName) {
    connection.name = options.dbName + ' Mock DB';
  }

  return {
    connection,
  } as mongoose.Mongoose;
}

function model(name: string, schema?: any): MockgooseModel {
  let collection: Record<string, any>;

  try {
    accessSync(dirpath);

    const files = readdirSync(dirpath);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const modelName = path.basename(file, '.json');
        const content = readFileSync(path.join(dirpath, file), 'utf-8');
        dbState[modelName] = JSON.parse(content);
      }
    }
  } catch {
    mkdirSync(dirpath, { recursive: true });
    dbState = {};
  }

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
  }) as unknown as MockgooseModel;
}

export { connect, connection, Model, model, Schema };
export default { connect, connection, Model, model, Schema };
