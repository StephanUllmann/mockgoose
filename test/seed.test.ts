import { describe, it, expect, beforeAll } from 'vitest';
import { MongooseBook, MockgooseBook } from './BookModels';
import exampleBooks from './exampleBooks.json';

describe('Database Seeding', () => {
  beforeAll(async () => {
    await MongooseBook.insertMany(exampleBooks);
    await MockgooseBook.insertMany(exampleBooks);
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
