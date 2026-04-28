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

describe('Model Creation Methods', () => {
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
});
