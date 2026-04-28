import { describe, it, expect, beforeAll } from 'vitest';
import { MongooseBook, MockgooseBook, MongooseAuthor, MockgooseAuthor } from './BookModels';
import exampleBooks from './exampleBooks.json';
import exampleAuthors from './exampleAuthors.json';

describe('Database Seeding', () => {
  beforeAll(async () => {
    const mAuthors = await MongooseAuthor.insertMany(exampleAuthors);
    const mockAuthors = await MockgooseAuthor.insertMany(exampleAuthors);

    const booksWithAuthors = exampleBooks.map((book, index) => ({
      ...book,
      authors: [mAuthors[index % mAuthors.length]._id],
    }));

    const mockBooksWithAuthors = exampleBooks.map((book, index) => ({
      ...book,
      authors: [mockAuthors[index % mockAuthors.length]._id],
    }));

    await MongooseBook.insertMany(booksWithAuthors);
    await MockgooseBook.insertMany(mockBooksWithAuthors);
  });

  it('should have seeded the database with all example authors', async () => {
    const authors = await MongooseAuthor.find({});
    const mockAuthors = await MockgooseAuthor.find({});
    expect(authors).toHaveLength(exampleAuthors.length);
    expect(mockAuthors).toHaveLength(exampleAuthors.length);
  });

  it('should have seeded the database with all example books', async () => {
    const books = await MongooseBook.find({});
    const mBooks = await MockgooseBook.find({});
    expect(books).toHaveLength(exampleBooks.length);
    expect(mBooks).toHaveLength(exampleBooks.length);
  });

  it('should verify that all books from the JSON are present by ISBN', async () => {
    const books = await MongooseBook.find({});
    const mBooks = await MockgooseBook.find({});

    const dbIsbns = books.map((book) => book.isbn).sort();
    const mDbIsbns = mBooks.map((book) => book.isbn).sort();
    const jsonIsbns = exampleBooks.map((book) => book.isbn).sort();

    expect(dbIsbns).toEqual(jsonIsbns);
    expect(mDbIsbns).toEqual(jsonIsbns);
    expect(mDbIsbns).toEqual(dbIsbns);
  });
});
