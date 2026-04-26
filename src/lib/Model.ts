import { DBState } from '../types/index.js';
import { Schema } from 'mongoose';
import { generateObjectId, isValidMockObjectId } from './utils/mockObjectId.js';
import QueryBuilder from './QueryBuilder.js';
import Document from './Document.js';

type InferSchemaType<S extends Schema> = S extends Schema<infer T> ? T : never;

export default class Model<TSchema extends Schema> {
  [key: string]: any;
  modelName!: string;

  constructor(
    public schema: Schema,
    public name: string,
    public _collection: Record<string, any>,
    public _dbState: DBState,
    public _sync: () => Promise<void>
  ) {
    this.modelName = name;
  }

  private _createDocument = (data: Record<string, any>) => {
    return new Document(data, this._dbState, this._sync);
  };

  private _createQueryBuilder = (data: Record<string, any>) => {
    return new QueryBuilder(
      data || null,
      this.schema,
      this._dbState,
      this._createDocument
    );
  };

  async create(newDoc: InferSchemaType<TSchema>) {
    const _id = generateObjectId();
    const toSave = { _id, ...newDoc };
    this._collection[_id] = toSave;
    await this._sync();
    return this._createDocument(toSave);
  }

  findById(id: string) {
    if (!isValidMockObjectId(id)) throw new Error('Invalid ObjectId');
    const docData = this._collection[id] || null;
    return this._createQueryBuilder(docData);
  }

  find(query?: Record<string, any>) {
    if (!query) return this._createQueryBuilder(this._collection);
    const found = Object.values(this._collection).filter((doc) => {
      return Object.entries(query).every(([key, condition]) => {
        return this._evaluateCondition(doc[key], condition);
      });
    });
    return this._createQueryBuilder(found);
  }

  findOne(query: Record<string, any>) {
    const found = Object.values(this._collection).find((doc) => {
      return Object.entries(query).every(([key, condition]) => {
        return this._evaluateCondition(doc[key], condition);
      });
    });
    return this._createQueryBuilder(found);
  }

  private _evaluateCondition(docValue: any, condition: any): boolean {
    // Helper: If docValue is an array, does ANY element match?
    const matchAny = (val: any, predicate: (v: any) => boolean) =>
      Array.isArray(val) ? val.some(predicate) : predicate(val);

    // Helper: If docValue is an array, do ALL elements match? (Needed for $ne, $nin)
    const matchAll = (val: any, predicate: (v: any) => boolean) =>
      Array.isArray(val) ? val.every(predicate) : predicate(val);

    // 1. Primitive conditions
    if (typeof condition !== 'object' || condition === null) {
      return matchAny(docValue, (v) => v === condition);
    }

    // 2. RegExp
    if (condition instanceof RegExp) {
      return matchAny(docValue, (v) => condition.test(String(v)));
    }

    // 3. Object containing $ operators (e.g., { $gt: 5, $lt: 10 })
    return Object.entries(condition).every(([operator, opValue]) => {
      switch (operator) {
        // Comparison
        case '$eq':
          return matchAny(docValue, (v) => v === opValue);
        case '$ne':
          return matchAll(docValue, (v) => v !== opValue);
        case '$gt':
          return matchAny(docValue, (v) => v > opValue);
        case '$gte':
          return matchAny(docValue, (v) => v >= opValue);
        case '$lt':
          return matchAny(docValue, (v) => v < opValue);
        case '$lte':
          return matchAny(docValue, (v) => v <= opValue);

        // Arrays
        case '$in':
          return matchAny(
            docValue,
            (v) => Array.isArray(opValue) && opValue.includes(v)
          );
        case '$nin':
          return matchAll(
            docValue,
            (v) => Array.isArray(opValue) && !opValue.includes(v)
          );

        // Element (Does not use matchAny/All because it evaluates the field's existence itself)
        case '$exists':
          const exists = docValue !== undefined;
          return opValue ? exists : !exists;

        // Evaluation ($regex as string)
        case '$regex':
          let regexToTest: RegExp;
          const options = (condition as any).$options as string | undefined;

          if (opValue instanceof RegExp) {
            regexToTest = options
              ? new RegExp(opValue.source, options)
              : opValue;
          } else {
            regexToTest = new RegExp(String(opValue), options);
          }

          return matchAny(docValue, (v) => regexToTest.test(String(v)));

        case '$options':
          // $options is handled inside the $regex block, so we just return true here
          return true;

        default:
          console.warn(`Mock warning: Unsupported operator ${operator}`);
          return false;
      }
    });
  }
}
