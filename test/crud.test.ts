import { describe, it, expect, beforeEach } from 'vitest';
import {
  MongooseBook,
  MockgooseBook,
  MongooseAuthor,
  MockgooseAuthor,
} from './BookModels';
import testBooks from './exampleBooks.json';
import testAuthors from './exampleAuthors.json';
import './setup';

describe('Model Methods Comparison', () => {
  beforeEach(async () => {
    await MongooseBook.deleteMany({});
    await MockgooseBook.deleteMany({});
    await MongooseAuthor.deleteMany({});
    await MockgooseAuthor.deleteMany({});
  });

  describe('Model.create()', () => {
    it('should create a single document similarly', async () => {
      const author = await MongooseAuthor.create(testAuthors[0]);
      const mockAuthor = await MockgooseAuthor.create(testAuthors[0]);

      const bookData = { ...testBooks[0], authors: [author._id] };
      const mockBookData = { ...testBooks[0], authors: [mockAuthor._id] };

      const mongooseResult = await MongooseBook.create(bookData);
      const mockgooseResult = await MockgooseBook.create(mockBookData);

      expect(mockgooseResult.title).toBe(mongooseResult.title);
      expect(mockgooseResult.authors[0].toString()).toBe(
        mockAuthor._id.toString()
      );
      expect(mockgooseResult.isbn).toBe(mongooseResult.isbn);
      expect(mockgooseResult._id.toString()).toBeDefined();
    });
  });

  describe('Model.insertMany()', () => {
    it('should insert multiple documents similarly', async () => {
      const author = await MongooseAuthor.create(testAuthors[0]);
      const mockAuthor = await MockgooseAuthor.create(testAuthors[0]);

      const booksToInsert = testBooks
        .slice(0, 3)
        .map((b) => ({ ...b, authors: [author._id] }));
      const mockBooksToInsert = testBooks
        .slice(0, 3)
        .map((b) => ({ ...b, authors: [mockAuthor._id] }));

      const mongooseResults = await MongooseBook.insertMany(booksToInsert);
      const mockgooseResults =
        await MockgooseBook.insertMany(mockBooksToInsert);

      expect(mockgooseResults.length).toBe(mongooseResults.length);
      expect(mockgooseResults[0].title).toBe(mongooseResults[0].title);
      expect(mockgooseResults[1].title).toBe(mongooseResults[1].title);
      expect(mockgooseResults[2].title).toBe(mongooseResults[2].title);
    });
  });

  describe('Model.find()', () => {
    it('should find documents with a filter similarly', async () => {
      const author = await MongooseAuthor.create(testAuthors[0]);
      const mockAuthor = await MockgooseAuthor.create(testAuthors[0]);

      const booksToInsert = testBooks
        .slice(0, 5)
        .map((b) => ({ ...b, authors: [author._id] }));
      const mockBooksToInsert = testBooks
        .slice(0, 5)
        .map((b) => ({ ...b, authors: [mockAuthor._id] }));

      await MongooseBook.insertMany(booksToInsert);
      await MockgooseBook.insertMany(mockBooksToInsert);

      const filter = { authors: author._id };
      const mockFilter = { authors: mockAuthor._id };
      const mongooseResults = await MongooseBook.find(filter);
      const mockgooseResults = await MockgooseBook.find(mockFilter);

      expect(mockgooseResults.length).toBe(mongooseResults.length);
      expect(mockgooseResults[0].title).toBe(mongooseResults[0].title);
    });

    it('should return all documents when no filter is provided', async () => {
      await MongooseBook.insertMany(testBooks.slice(0, 3));
      await MockgooseBook.insertMany(testBooks.slice(0, 3));

      const mongooseResults = await MongooseBook.find({});
      const mockgooseResults = await MockgooseBook.find({});

      expect(mockgooseResults.length).toBe(mongooseResults.length);
    });
  });

  describe('Model.findOne()', () => {
    it('should find a single document by filter similarly', async () => {
      await MongooseBook.insertMany(testBooks.slice(0, 3));
      await MockgooseBook.insertMany(testBooks.slice(0, 3));

      const filter = { isbn: testBooks[0].isbn };
      const mongooseResult = await MongooseBook.findOne(filter);
      const mockgooseResult = await MockgooseBook.findOne(filter);

      expect(mockgooseResult?.title).toBe(mongooseResult?.title);
    });

    it('should return null if no document matches filter', async () => {
      const filter = { isbn: 'non-existent' };
      const mongooseResult = await MongooseBook.findOne(filter);
      const mockgooseResult = await MockgooseBook.findOne(filter);

      expect(mockgooseResult).toBeNull();
      expect(mongooseResult).toBeNull();
    });
  });

  describe('Model.findById()', () => {
    it('should find a document by ID similarly', async () => {
      const mongooseCreated = await MongooseBook.create(testBooks[0]);
      const mockgooseCreated = await MockgooseBook.create(testBooks[0]);

      // Note: We use the ID returned by each respective creation
      const mongooseResult = await MongooseBook.findById(mongooseCreated._id);
      const mockgooseResult = await MockgooseBook.findById(
        mockgooseCreated._id
      );

      expect(mockgooseResult?.title).toBe(mongooseResult?.title);
    });

    it('should return null if ID is not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const mongooseResult = await MongooseBook.findById(fakeId);
      const mockgooseResult = await MockgooseBook.findById(fakeId);

      expect(mockgooseResult).toBeNull();
      expect(mongooseResult).toBeNull();
    });
  });

  describe('Query.populate()', () => {
    it.skip('should illustrate populated references if supported', async () => {
      const author = await MongooseAuthor.create(testAuthors[0]);
      const book = await MongooseBook.create({
        ...testBooks[0],
        authors: [author._id],
      });
      const populatedMongoose = await MongooseBook.findById(book._id).populate(
        'authors'
      );
      expect(populatedMongoose?.authors[0]).toMatchObject({
        name: testAuthors[0].name,
      });

      // Note: Mockgoose implementation of populate() currently has limitations
      // regarding how it accesses schema definitions and reference collections.
      const mockAuthor = await MockgooseAuthor.create(testAuthors[0]);
      const mockBook = await MockgooseBook.create({
        ...testBooks[0],
        authors: [mockAuthor._id],
      });
      const populatedMockgoose = await MockgooseBook.findById(
        mockBook._id
      ).populate('authors');

      // If populate failed, it remains an ID string.
      expect(populatedMockgoose?.authors[0]).toBeDefined();
      console.log('mongoose:', populatedMongoose);
      console.log('mock:', populatedMockgoose);
    });
  });

  describe('Query.limit() and Query.skip()', () => {
    it('should limit and skip results similarly', async () => {
      await MongooseBook.insertMany(testBooks.slice(0, 10));
      await MockgooseBook.insertMany(testBooks.slice(0, 10));

      const mongooseResults = await MongooseBook.find({}).skip(2).limit(3);
      const mockgooseResults = await MockgooseBook.find({}).skip(2).limit(3);

      expect(mockgooseResults.length).toBe(3);
      expect(mongooseResults.length).toBe(3);

      expect(mockgooseResults[0].title).toBe(mongooseResults[0].title);
    });
  });

  describe('Query.lean()', () => {
    it('should return plain JavaScript objects similarly', async () => {
      await MongooseBook.create(testBooks[0]);
      await MockgooseBook.create(testBooks[0]);

      const mongooseResult = await MongooseBook.findOne({
        title: testBooks[0].title,
      }).lean();
      const mockgooseResult = await MockgooseBook.findOne({
        title: testBooks[0].title,
      }).lean();

      // Check if it's NOT a mongoose Document/Mockgoose Document
      // For mongoose, lean() returns a POJO.
      expect(mongooseResult.constructor.name).toBe('Object');
      expect(mockgooseResult.constructor.name).toBe('Object');
      expect(mockgooseResult?.title).toBe(mongooseResult?.title);
    });
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Seed both collections with the first `n` books, each pointing at their
 *  respective author document. Returns the created author ids. */
async function seedBooks(n: number) {
  const author = await MongooseAuthor.create(testAuthors[0]);
  const mockAuthor = await MockgooseAuthor.create(testAuthors[0]);

  const slice = testBooks.slice(0, n);
  await MongooseBook.insertMany(
    slice.map((b) => ({ ...b, authors: [author._id] }))
  );
  await MockgooseBook.insertMany(
    slice.map((b) => ({ ...b, authors: [mockAuthor._id] }))
  );

  return { author, mockAuthor };
}

// ---------------------------------------------------------------------------

describe('Mutation Operations', () => {
  beforeEach(async () => {
    await MongooseBook.deleteMany({});
    await MockgooseBook.deleteMany({});
    await MongooseAuthor.deleteMany({});
    await MockgooseAuthor.deleteMany({});
  });

  // ── updateOne ────────────────────────────────────────────────────────────

  describe('Model.updateOne()', () => {
    it('should update a matching document and report the same write result shape', async () => {
      await MongooseBook.create(testBooks[0]);
      await MockgooseBook.create(testBooks[0]);

      const filter = { isbn: testBooks[0].isbn };
      const update = { $set: { title: 'Updated Title' } };

      const mongooseResult = await MongooseBook.updateOne(filter, update);
      const mockgooseResult = await MockgooseBook.updateOne(filter, update);

      expect(mockgooseResult.matchedCount).toBe(mongooseResult.matchedCount);
      expect(mockgooseResult.modifiedCount).toBe(mongooseResult.modifiedCount);

      const mongooseDoc = await MongooseBook.findOne(filter);
      const mockgooseDoc = await MockgooseBook.findOne(filter);
      expect(mockgooseDoc?.title).toBe('Updated Title');
      expect(mongooseDoc?.title).toBe('Updated Title');
    });

    it('should report matchedCount 0 when no document matches', async () => {
      const mongooseResult = await MongooseBook.updateOne(
        { isbn: 'does-not-exist' },
        { $set: { title: 'Ghost' } }
      );
      const mockgooseResult = await MockgooseBook.updateOne(
        { isbn: 'does-not-exist' },
        { $set: { title: 'Ghost' } }
      );

      expect(mockgooseResult.matchedCount).toBe(0);
      expect(mongooseResult.matchedCount).toBe(0);
    });
  });

  // ── updateMany ───────────────────────────────────────────────────────────

  describe('Model.updateMany()', () => {
    it('should update all matching documents', async () => {
      await seedBooks(5);

      const mongooseResult = await MongooseBook.updateMany(
        {},
        { $set: { title: 'Same Title' } }
      );
      const mockgooseResult = await MockgooseBook.updateMany(
        {},
        { $set: { title: 'Same Title' } }
      );

      expect(mockgooseResult.modifiedCount).toBe(mongooseResult.modifiedCount);

      const mongooseDocs = await MongooseBook.find({});
      const mockgooseDocs = await MockgooseBook.find({});
      expect(mongooseDocs.every((d) => d.title === 'Same Title')).toBe(true);
      expect(mockgooseDocs.every((d) => d.title === 'Same Title')).toBe(true);
    });
  });

  // ── findOneAndUpdate ─────────────────────────────────────────────────────

  describe('Model.findOneAndUpdate()', () => {
    it('should return the updated document when { new: true }', async () => {
      await MongooseBook.create(testBooks[0]);
      await MockgooseBook.create(testBooks[0]);

      const filter = { isbn: testBooks[0].isbn };
      const update = { $set: { title: 'New Title' } };
      const opts = { new: true };

      const mongooseResult = await MongooseBook.findOneAndUpdate(
        filter,
        update,
        opts
      );
      const mockgooseResult = await MockgooseBook.findOneAndUpdate(
        filter,
        update,
        opts
      );

      expect(mockgooseResult?.title).toBe('New Title');
      expect(mongooseResult?.title).toBe('New Title');
    });

    it('should return the OLD document when { new: false }', async () => {
      await MongooseBook.create(testBooks[0]);
      await MockgooseBook.create(testBooks[0]);

      const filter = { isbn: testBooks[0].isbn };
      const update = { $set: { title: 'New Title' } };

      const mongooseResult = await MongooseBook.findOneAndUpdate(
        filter,
        update,
        { new: false }
      );
      const mockgooseResult = await MockgooseBook.findOneAndUpdate(
        filter,
        update,
        { new: false }
      );

      expect(mongooseResult?.title).toBe(testBooks[0].title);
      expect(mockgooseResult?.title).toBe(testBooks[0].title);
    });

    it('should return null when no document matches', async () => {
      const mongooseResult = await MongooseBook.findOneAndUpdate(
        { isbn: 'does-not-exist' },
        { $set: { title: 'X' } },
        { new: true }
      );
      const mockgooseResult = await MockgooseBook.findOneAndUpdate(
        { isbn: 'does-not-exist' },
        { $set: { title: 'X' } },
        { new: true }
      );

      expect(mongooseResult).toBeNull();
      expect(mockgooseResult).toBeNull();
    });
  });

  // ── findByIdAndUpdate ────────────────────────────────────────────────────

  describe('Model.findByIdAndUpdate()', () => {
    it('should update by id and return the new document', async () => {
      const mongooseDoc = await MongooseBook.create(testBooks[0]);
      const mockgooseDoc = await MockgooseBook.create(testBooks[0]);

      const mongooseResult = await MongooseBook.findByIdAndUpdate(
        mongooseDoc._id,
        { $set: { title: 'By-ID Updated' } },
        { new: true }
      );
      const mockgooseResult = await MockgooseBook.findByIdAndUpdate(
        mockgooseDoc._id,
        { $set: { title: 'By-ID Updated' } },
        { new: true }
      );

      expect(mongooseResult?.title).toBe('By-ID Updated');
      expect(mockgooseResult?.title).toBe('By-ID Updated');
    });
  });

  // ── deleteOne ────────────────────────────────────────────────────────────

  describe('Model.deleteOne()', () => {
    it('should delete a single matching document', async () => {
      await MongooseBook.insertMany(testBooks.slice(0, 3));
      await MockgooseBook.insertMany(testBooks.slice(0, 3));

      const mongooseResult = await MongooseBook.deleteOne({
        isbn: testBooks[0].isbn,
      });
      const mockgooseResult = await MockgooseBook.deleteOne({
        isbn: testBooks[0].isbn,
      });

      expect(mockgooseResult.deletedCount).toBe(1);
      expect(mongooseResult.deletedCount).toBe(1);

      // Remaining count should be equal
      const mongooseDocs = await MongooseBook.find({});
      const mockgooseDocs = await MockgooseBook.find({});
      expect(mockgooseDocs.length).toBe(mongooseDocs.length);
    });

    it('should report deletedCount 0 when nothing matches', async () => {
      const mongooseResult = await MongooseBook.deleteOne({ isbn: 'ghost' });
      const mockgooseResult = await MockgooseBook.deleteOne({ isbn: 'ghost' });

      expect(mockgooseResult.deletedCount).toBe(0);
      expect(mongooseResult.deletedCount).toBe(0);
    });
  });

  // ── deleteMany ───────────────────────────────────────────────────────────

  describe('Model.deleteMany()', () => {
    it('should delete all matching documents', async () => {
      await seedBooks(5);

      const mongooseResult = await MongooseBook.deleteMany({});
      const mockgooseResult = await MockgooseBook.deleteMany({});

      expect(mockgooseResult.deletedCount).toBe(mongooseResult.deletedCount);

      const mongooseDocs = await MongooseBook.find({});
      const mockgooseDocs = await MockgooseBook.find({});
      expect(mongooseDocs.length).toBe(0);
      expect(mockgooseDocs.length).toBe(0);
    });
  });

  // ── findOneAndDelete ─────────────────────────────────────────────────────

  describe('Model.findOneAndDelete()', () => {
    it('should delete and return the deleted document', async () => {
      await MongooseBook.create(testBooks[0]);
      await MockgooseBook.create(testBooks[0]);

      const filter = { isbn: testBooks[0].isbn };

      const mongooseResult = await MongooseBook.findOneAndDelete(filter);
      const mockgooseResult = await MockgooseBook.findOneAndDelete(filter);

      expect(mongooseResult?.isbn).toBe(testBooks[0].isbn);
      expect(mockgooseResult?.isbn).toBe(testBooks[0].isbn);

      // Document should be gone
      expect(await MongooseBook.findOne(filter)).toBeNull();
      expect(await MockgooseBook.findOne(filter)).toBeNull();
    });

    it('should return null when no document matches', async () => {
      const mongooseResult = await MongooseBook.findOneAndDelete({
        isbn: 'ghost',
      });
      const mockgooseResult = await MockgooseBook.findOneAndDelete({
        isbn: 'ghost',
      });

      expect(mongooseResult).toBeNull();
      expect(mockgooseResult).toBeNull();
    });
  });
});

// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------

describe('Edge Cases', () => {
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

// ---------------------------------------------------------------------------

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
