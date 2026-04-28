import { afterAll, beforeAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { rm } from 'fs/promises';
import mongoose from 'mongoose';
import mockgoose from '../src/index';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  await mockgoose.connect('definitely://not-a@C0nNeCt1on.string');
});

afterAll(async () => {
  if (mongod) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongod.stop();
  }
  await mockgoose.connection.dropDatabase();
});
