import { describe, it, expect, beforeEach } from 'vitest';
import {
  MongooseBook,
  MockgooseBook,
} from './BookModels';
import testBooks from './exampleBooks.json';
import './setup';

describe('Collection Edge Cases', () => {
  beforeEach(async () => {
    await MongooseBook.deleteMany({});
    await MockgooseBook.deleteMany({});
  });

  it('find({}) on empty collection — should return empty array', async () => {
    const mongooseDocs = await MongooseBook.find({});
    const mockgooseDocs = await MockgooseBook.find({});

    expect(mongooseDocs).toEqual([]);
    expect(mockgooseDocs).toEqual([]);
  });

  it('findOne({}) on empty collection — should return null', async () => {
    expect(await MongooseBook.findOne({})).toBeNull();
    expect(await MockgooseBook.findOne({})).toBeNull();
  });

  it('findById() with a malformed ObjectId — should throw a CastError', async () => {
    await expect(MongooseBook.findById('not-a-valid-id')).rejects.toThrow();
    await expect(MockgooseBook.findById('not-a-valid-id')).rejects.toThrow();
  });

  it('create() with missing required field — should throw a ValidationError', async () => {
    // Assumes `isbn` (or whichever field) is marked required in the schema
    await expect(MongooseBook.create({ title: 'No ISBN' })).rejects.toThrow();
    await expect(MockgooseBook.create({ title: 'No ISBN' })).rejects.toThrow();
  });

  it('create() with wrong field type — should throw a ValidationError or cast error', async () => {
    // Pass a non-string where a string is expected, etc.
    await expect(
      MongooseBook.create({ ...testBooks[0], isbn: { nested: 'object' } })
    ).rejects.toThrow();
    await expect(
      MockgooseBook.create({ ...testBooks[0], isbn: { nested: 'object' } })
    ).rejects.toThrow();
  });
});

describe('Document Instance Behaviour', () => {
  beforeEach(async () => {
    await MongooseBook.deleteMany({});
    await MockgooseBook.deleteMany({});
  });

  it('non-lean find() — result should have .toObject() method', async () => {
    await MongooseBook.create(testBooks[0]);
    await MockgooseBook.create(testBooks[0]);

    const mongooseDoc = await MongooseBook.findOne({ isbn: testBooks[0].isbn });
    const mockgooseDoc = await MockgooseBook.findOne({
      isbn: testBooks[0].isbn,
    });

    expect(typeof mongooseDoc?.toObject).toBe('function');
    expect(typeof mockgooseDoc?.toObject).toBe('function');
  });

  it('non-lean find() — result should have .toJSON() method', async () => {
    await MongooseBook.create(testBooks[0]);
    await MockgooseBook.create(testBooks[0]);

    const mongooseDoc = await MongooseBook.findOne({ isbn: testBooks[0].isbn });
    const mockgooseDoc = await MockgooseBook.findOne({
      isbn: testBooks[0].isbn,
    });

    expect(typeof mongooseDoc?.toJSON).toBe('function');
    expect(typeof mockgooseDoc?.toJSON).toBe('function');
  });

  it('non-lean find() — result should have a .save() method', async () => {
    await MongooseBook.create(testBooks[0]);
    await MockgooseBook.create(testBooks[0]);

    const mongooseDoc = await MongooseBook.findOne({ isbn: testBooks[0].isbn });
    const mockgooseDoc = await MockgooseBook.findOne({
      isbn: testBooks[0].isbn,
    });

    expect(typeof mongooseDoc?.save).toBe('function');
    expect(typeof mockgooseDoc?.save).toBe('function');
  });

  it('.save() should persist in-place mutations', async () => {
    await MongooseBook.create(testBooks[0]);
    await MockgooseBook.create(testBooks[0]);

    const mongooseDoc = await MongooseBook.findOne({ isbn: testBooks[0].isbn });
    const mockgooseDoc = await MockgooseBook.findOne({
      isbn: testBooks[0].isbn,
    });

    mongooseDoc!.title = 'Mutated via save';
    mockgooseDoc!.title = 'Mutated via save';

    await mongooseDoc!.save();
    await mockgooseDoc!.save();

    const mongooseRefetch = await MongooseBook.findOne({
      isbn: testBooks[0].isbn,
    });
    const mockgooseRefetch = await MockgooseBook.findOne({
      isbn: testBooks[0].isbn,
    });

    expect(mongooseRefetch?.title).toBe('Mutated via save');
    expect(mockgooseRefetch?.title).toBe('Mutated via save');
  });

  it('lean() result — should NOT have .save() or .toObject()', async () => {
    await MongooseBook.create(testBooks[0]);
    await MockgooseBook.create(testBooks[0]);

    const mongooseDoc = await MongooseBook.findOne({
      isbn: testBooks[0].isbn,
    }).lean();
    const mockgooseDoc = await MockgooseBook.findOne({
      isbn: testBooks[0].isbn,
    }).lean();

    // Plain objects don't have these prototype methods
    expect((mongooseDoc as any)?.save).toBeUndefined();
    expect((mockgooseDoc as any)?.save).toBeUndefined();
    expect((mongooseDoc as any)?.toObject).toBeUndefined();
    expect((mockgooseDoc as any)?.toObject).toBeUndefined();
  });

  it('toObject() should return a plain object with the same data as the document', async () => {
    const mongooseDoc = await MongooseBook.create(testBooks[0]);
    const mockgooseDoc = await MockgooseBook.create(testBooks[0]);

    const mongoosePojo = mongooseDoc.toObject();
    const mockgoosePojo = mockgooseDoc.toObject();

    expect(mongoosePojo.constructor.name).toBe('Object');
    expect(mockgoosePojo.constructor.name).toBe('Object');
    expect(mockgoosePojo.title).toBe(mongoosePojo.title);
    expect(mockgoosePojo.isbn).toBe(mongoosePojo.isbn);
  });
});
