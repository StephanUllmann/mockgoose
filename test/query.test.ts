import { describe, it, expect, beforeEach } from 'vitest';
import {
  MongooseBook,
  MockgooseBook,
  MongooseAuthor,
  MockgooseAuthor,
} from './BookModels';
import testBooks from './exampleBooks.json';
import './setup';

describe('Query Operators', () => {
  beforeEach(async () => {
    await MongooseBook.deleteMany({});
    await MockgooseBook.deleteMany({});
    await MongooseAuthor.deleteMany({});
    await MockgooseAuthor.deleteMany({});
    // Seed a stable dataset for all query-operator tests
    await MongooseBook.insertMany(testBooks);
    await MockgooseBook.insertMany(testBooks);
  });

  it('$gte / $lte — should filter by numeric range', async () => {
    // Assumes testBooks have a numeric `year` field; adjust field name if different
    const filter = { year: { $gte: 2000, $lte: 2010 } };

    const mongooseDocs = await MongooseBook.find(filter).sort({ isbn: 1 });
    const mockgooseDocs = await MockgooseBook.find(filter).sort({ isbn: 1 });

    expect(mockgooseDocs.length).toBe(mongooseDocs.length);
    mongooseDocs.forEach((doc, i) => {
      expect(mockgooseDocs[i].isbn).toBe(doc.isbn);
    });
  });

  it('$in — should return documents whose field value is in the given array', async () => {
    const isbns = [testBooks[0].isbn, testBooks[2].isbn];
    const filter = { isbn: { $in: isbns } };

    const mongooseDocs = await MongooseBook.find(filter).sort({ isbn: 1 });
    const mockgooseDocs = await MockgooseBook.find(filter).sort({ isbn: 1 });

    expect(mockgooseDocs.length).toBe(mongooseDocs.length);
    expect(mockgooseDocs.length).toBe(2);
    mongooseDocs.forEach((doc, i) => {
      expect(mockgooseDocs[i].isbn).toBe(doc.isbn);
    });
  });

  it('$nin — should exclude documents whose field value is in the given array', async () => {
    const isbns = [testBooks[0].isbn, testBooks[1].isbn];
    const filter = { isbn: { $nin: isbns } };

    const mongooseDocs = await MongooseBook.find(filter).sort({ isbn: 1 });
    const mockgooseDocs = await MockgooseBook.find(filter).sort({ isbn: 1 });

    expect(mockgooseDocs.length).toBe(mongooseDocs.length);
    expect(mockgooseDocs.length).toBe(testBooks.length - 2);
  });

  it('$ne — should exclude documents where field equals the given value', async () => {
    const filter = { isbn: { $ne: testBooks[0].isbn } };

    const mongooseDocs = await MongooseBook.find(filter);
    const mockgooseDocs = await MockgooseBook.find(filter);

    expect(mockgooseDocs.length).toBe(mongooseDocs.length);
    expect(mockgooseDocs.every((d) => d.isbn !== testBooks[0].isbn)).toBe(true);
  });

  it('$or — should return documents matching any of the conditions', async () => {
    const filter = {
      $or: [{ isbn: testBooks[0].isbn }, { isbn: testBooks[1].isbn }],
    };

    const mongooseDocs = await MongooseBook.find(filter).sort({ isbn: 1 });
    const mockgooseDocs = await MockgooseBook.find(filter).sort({ isbn: 1 });

    expect(mockgooseDocs.length).toBe(2);
    expect(mockgooseDocs.length).toBe(mongooseDocs.length);
  });

  it('$and — should return documents matching all conditions', async () => {
    const filter = {
      $and: [{ isbn: testBooks[0].isbn }, { title: testBooks[0].title }],
    };

    const mongooseDocs = await MongooseBook.find(filter);
    const mockgooseDocs = await MockgooseBook.find(filter);

    expect(mockgooseDocs.length).toBe(1);
    expect(mockgooseDocs.length).toBe(mongooseDocs.length);
  });

  it('$exists — should find documents where a field is present', async () => {
    const filter = { isbn: { $exists: true } };

    const mongooseDocs = await MongooseBook.find(filter);
    const mockgooseDocs = await MockgooseBook.find(filter);

    expect(mockgooseDocs.length).toBe(mongooseDocs.length);
  });

  it('regex filter — should match documents by pattern', async () => {
    // Match titles that start with the first character of testBooks[0].title
    const firstChar = testBooks[0].title[0];
    const filter = { title: new RegExp(`^${firstChar}`, 'i') };

    const mongooseDocs = await MongooseBook.find(filter).sort({ isbn: 1 });
    const mockgooseDocs = await MockgooseBook.find(filter).sort({ isbn: 1 });

    expect(mockgooseDocs.length).toBe(mongooseDocs.length);
    mongooseDocs.forEach((doc, i) => {
      expect(mockgooseDocs[i].isbn).toBe(doc.isbn);
    });
  });
});

describe('Query Chaining — sort, skip, limit independently', () => {
  beforeEach(async () => {
    await MongooseBook.deleteMany({});
    await MockgooseBook.deleteMany({});
    await MongooseBook.insertMany(testBooks.slice(0, 10));
    await MockgooseBook.insertMany(testBooks.slice(0, 10));
  });

  it('sort() ascending — results should be in the same order', async () => {
    const mongooseDocs = await MongooseBook.find({}).sort({ isbn: 1 });
    const mockgooseDocs = await MockgooseBook.find({}).sort({ isbn: 1 });

    expect(mockgooseDocs.length).toBe(mongooseDocs.length);
    mongooseDocs.forEach((doc, i) => {
      expect(mockgooseDocs[i].isbn).toBe(doc.isbn);
    });
  });

  it('sort() descending — results should be in the same order', async () => {
    const mongooseDocs = await MongooseBook.find({}).sort({ isbn: -1 });
    const mockgooseDocs = await MockgooseBook.find({}).sort({ isbn: -1 });

    mongooseDocs.forEach((doc, i) => {
      expect(mockgooseDocs[i].isbn).toBe(doc.isbn);
    });
  });

  it('limit() alone — should return exactly n documents', async () => {
    const mongooseDocs = await MongooseBook.find({}).limit(4);
    const mockgooseDocs = await MockgooseBook.find({}).limit(4);

    expect(mongooseDocs.length).toBe(4);
    expect(mockgooseDocs.length).toBe(4);
  });

  it('skip() alone — should skip the first n documents', async () => {
    const all = await MongooseBook.find({}).sort({ isbn: 1 });
    const mongooseDocs = await MongooseBook.find({}).sort({ isbn: 1 }).skip(3);
    const mockgooseDocs = await MockgooseBook.find({})
      .sort({ isbn: 1 })
      .skip(3);

    expect(mongooseDocs.length).toBe(all.length - 3);
    expect(mockgooseDocs.length).toBe(mongooseDocs.length);
    expect(mockgooseDocs[0].isbn).toBe(mongooseDocs[0].isbn);
  });

  it('skip() beyond collection size — should return empty array', async () => {
    const mongooseDocs = await MongooseBook.find({}).skip(9999);
    const mockgooseDocs = await MockgooseBook.find({}).skip(9999);

    expect(mongooseDocs.length).toBe(0);
    expect(mockgooseDocs.length).toBe(0);
  });

  it('sort() + skip() + limit() combined — should produce identical pages', async () => {
    const mongooseDocs = await MongooseBook.find({})
      .sort({ isbn: 1 })
      .skip(2)
      .limit(3);
    const mockgooseDocs = await MockgooseBook.find({})
      .sort({ isbn: 1 })
      .skip(2)
      .limit(3);

    expect(mockgooseDocs.length).toBe(3);
    expect(mongooseDocs.length).toBe(3);
    mongooseDocs.forEach((doc, i) => {
      expect(mockgooseDocs[i].isbn).toBe(doc.isbn);
    });
  });
});
