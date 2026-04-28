import { describe, it, expect, beforeAll } from 'vitest';
import { MongooseBook } from './mongooseBook';
import exampleBooks from './exampleBooks.json';

describe('Database Seeding', () => {
  beforeAll(async () => {
    await MongooseBook.insertMany(exampleBooks);
  });

  it('should have seeded the database with all example books', async () => {
    const books = await MongooseBook.find({});
    expect(books).toHaveLength(exampleBooks.length);
  });

  it('should verify that all books from the JSON are present by ISBN', async () => {
    const books = await MongooseBook.find({});
    const dbIsbns = books.map((book) => book.isbn).sort();
    const jsonIsbns = exampleBooks.map((book) => book.isbn).sort();

    expect(dbIsbns).toEqual(jsonIsbns);
  });
});
