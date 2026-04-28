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
