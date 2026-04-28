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

describe('Model Mutation Methods', () => {
  beforeEach(async () => {
    await MongooseBook.deleteMany({});
    await MockgooseBook.deleteMany({});
    await MongooseAuthor.deleteMany({});
    await MockgooseAuthor.deleteMany({});
  });

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

  describe('Model.findByIdAndUpdate()', () => {
    it('should update by id and return the new document', async () => {
      const mongooseDoc = await MongooseBook.create(testBooks[0]);
      const mockgooseDoc = await MockgooseBook.create(testBooks[0]);

      const mongooseResult = await MongooseBook.findByIdAndUpdate(
        mongooseDoc._id,
        { title: 'By-ID Updated' },
        { new: true }
      );
      const mockgooseResult = await MockgooseBook.findByIdAndUpdate(
        mockgooseDoc._id,
        { title: 'By-ID Updated' },
        { new: true }
      );

      expect(mongooseResult?.title).toBe('By-ID Updated');
      expect(mockgooseResult?.title).toBe('By-ID Updated');
    });
  });

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
