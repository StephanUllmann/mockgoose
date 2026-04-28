import { describe, it, expect, beforeEach } from 'vitest';
import { MongooseBook, MockgooseBook } from './BookModels';
import testBooks from './exampleBooks.json';
import './setup';

describe('Model Methods Comparison', () => {
  beforeEach(async () => {
    await MongooseBook.deleteMany({});
    await MockgooseBook.deleteMany({});
  });

  describe('Model.create()', () => {
    it('should create a single document similarly', async () => {
      const bookData = testBooks[0];
      const mongooseResult = await MongooseBook.create(bookData);
      const mockgooseResult = await MockgooseBook.create(bookData);

      expect(mockgooseResult.title).toBe(mongooseResult.title);
      expect(mockgooseResult.author).toBe(mongooseResult.author);
      expect(mockgooseResult.isbn).toBe(mongooseResult.isbn);
      expect(mockgooseResult._id.toString()).toBeDefined();
    });
  });

  describe('Model.insertMany()', () => {
    it('should insert multiple documents similarly', async () => {
      const mongooseResults = await MongooseBook.insertMany(testBooks.slice(0, 3));
      const mockgooseResults = await MockgooseBook.insertMany(testBooks.slice(0, 3));

      expect(mockgooseResults.length).toBe(mongooseResults.length);
      expect(mockgooseResults[0].title).toBe(mongooseResults[0].title);
      expect(mockgooseResults[1].title).toBe(mongooseResults[1].title);
      expect(mockgooseResults[2].title).toBe(mongooseResults[2].title);
    });
  });

  describe('Model.find()', () => {
    it('should find documents with a filter similarly', async () => {
      await MongooseBook.insertMany(testBooks.slice(0, 5));
      await MockgooseBook.insertMany(testBooks.slice(0, 5));

      const filter = { author: 'Marcus Aurelius' };
      const mongooseResults = await MongooseBook.find(filter);
      const mockgooseResults = await MockgooseBook.find(filter);

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
      const mockgooseResult = await MockgooseBook.findById(mockgooseCreated._id);

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
});
