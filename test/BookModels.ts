import { model, Schema } from 'mongoose';
import mockgoose from '../src/index';

const isbnPattern =
  /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/;

// title, author, isbn, category, year

const definition = {
  author: {
    type: String,
    maxLength: 500,
  },
  title: {
    type: String,
    maxLength: 500,
  },
  description: {
    type: String,
    maxLength: 10000,
  },
  pageNumber: {
    type: Number,
    min: 0,
  },
  year: {
    type: Number,
    min: -2000,
    max: 3000,
  },
  isbn: {
    type: String,
    match: isbnPattern,
    unique: true,
  },
  genre: [{ type: String, maxLength: 50 }],
};

const mongooseBookSchema = new Schema(definition);

const mockgooseBookSchema = new mockgoose.Schema(definition);

const MongooseBook = model('book', mongooseBookSchema);
const MockgooseBook = mockgoose.model('book', mockgooseBookSchema);
export { MongooseBook, MockgooseBook };
