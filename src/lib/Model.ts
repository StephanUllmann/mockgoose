import { DBState } from '../types/index.js';
import mongoose, { Schema } from 'mongoose';
import { generateObjectId, isValidMockObjectId } from './utils/mockObjectId.js';
import QueryBuilder from './QueryBuilder.js';
import Document from './Document.js';
import { Mongoose } from 'mongoose';

type InferSchemaType<S extends Schema> = S extends Schema<infer T> ? T : never;

/**
 * Represents a model in the mock database.
 */
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

  private _createQueryBuilder = (
    data: Record<string, any>,
    onExecute?: () => void
  ) => {
    return new QueryBuilder(
      data || null,
      this.schema,
      this._dbState,
      this._createDocument,
      onExecute
    );
  };

  /**
   * Creates a new document and saves it to the mock collection.
   *
   * @param newDoc - The document data to save.
   * @returns A promise that resolves to the created document.
   */
  async create(newDoc: InferSchemaType<TSchema>): Promise<Document> {
    const _id = generateObjectId();
    const toSave = { _id, ...newDoc };
    this._collection[_id] = toSave;
    await this._sync();
    return this._createDocument(toSave);
  }

  /**
   * Inserts multiple documents into the mock collection.
   *
   * @param newDocs - The array of document data to save.
   * @returns A promise that resolves to an array of created documents.
   */
  async insertMany(newDocs: InferSchemaType<TSchema>[]): Promise<Document[]> {
    const out: Document[] = [];
    for (const newDoc of newDocs) {
      const _id = generateObjectId();
      const toSave = { _id, ...newDoc };
      this._collection[_id] = toSave;
      out.push(this._createDocument(toSave));
    }
    await this._sync();
    return out;
  }

  /**
   * Finds a document by its ID.
   *
   * @param id - The ID of the document.
   * @returns A QueryBuilder for the document.
   * @throws {Error} If the ID is invalid.
   */
  findById(id: string): QueryBuilder {
    if (!isValidMockObjectId(id))
      throw new Error('CastError: Invalid ObjectId');
    const docData = this._collection[id] || null;
    return this._createQueryBuilder(docData);
  }

  /**
   * Finds documents that match the given query.
   *
   * @param query - The search query.
   * @returns A QueryBuilder for the matching documents.
   */
  find(query?: Record<string, any>): QueryBuilder {
    if (!query)
      return this._createQueryBuilder(Object.values(this._collection));
    const found = this._findAllByQuery(query);
    return this._createQueryBuilder(found);
  }

  /**
   * Finds a single document that matches the given query.
   *
   * @param query - The search query.
   * @returns A QueryBuilder for the matching document.
   */
  findOne(query: Record<string, any>): QueryBuilder {
    const found = this._findOneByQuery(query);
    return this._createQueryBuilder(found);
  }

  /**
   * Finds a document by its ID and updates it.
   *
   * @param id - The ID of the document.
   * @param data - The update data.
   * @param options - Mongoose-like options (e.g., `{ new: true }`).
   * @returns A QueryBuilder for the document.
   * @throws {Error} If the ID is invalid.
   */
  findByIdAndUpdate(
    id: string,
    data: any,
    options?: Record<string, any>
  ): QueryBuilder {
    if (!isValidMockObjectId(id))
      throw new Error('CastError: Invalid ObjectId');
    const found = this._collection[id];
    if (!found) return this._createQueryBuilder(null);
    const updated = { ...found, ...data };
    const onExecute = async () => {
      if (found) {
        this._collection[id] = updated;
        await this._sync();
      }
    };

    const returnNew =
      options?.new === true || options?.returnDocument === 'after';

    return returnNew
      ? this._createQueryBuilder(updated, onExecute)
      : this._createQueryBuilder(found, onExecute);
  }

  /**
   * Finds a document by query and updates it.
   *
   * @param query - The search query.
   * @param data - The update data.
   * @param options - Mongoose-like options (e.g., `{ new: true }`).
   * @returns A QueryBuilder for the document.
   */
  findOneAndUpdate(
    query: Record<string, any>,
    data: any,
    options?: Record<string, any>
  ): QueryBuilder {
    if ('$set' in data) data = data['$set'];
    const found = this._findOneByQuery(query);
    if (!found) return this._createQueryBuilder(null);
    const updated = { ...found, ...data };
    const onExecute = async () => {
      if (found) {
        this._collection[found._id] = updated;
        await this._sync();
      }
    };
    const returnNew =
      options?.new === true || options?.returnDocument === 'after';
    return returnNew
      ? this._createQueryBuilder(updated, onExecute)
      : this._createQueryBuilder(found, onExecute);
  }

  /**
   * Finds a document by its ID and deletes it.
   *
   * @param id - The ID of the document.
   * @param _options - Additional options.
   * @returns A QueryBuilder for the deleted document.
   * @throws {Error} If the ID is invalid.
   */
  findByIdAndDelete(id: string, _options?: Record<string, any>): QueryBuilder {
    if (!isValidMockObjectId(id))
      throw new Error('CastError: Invalid ObjectId');
    const found = this._collection[id];
    const onExecute = async () => {
      if (found) {
        delete this._collection[id];
      }
      await this._sync();
    };
    return this._createQueryBuilder(found, onExecute);
  }

  /**
   * Finds a document by query and deletes it.
   *
   * @param query - The search query.
   * @param _options - Additional options.
   * @returns A QueryBuilder for the deleted document.
   */
  findOneAndDelete(
    query: Record<string, any>,
    _options?: Record<string, any>
  ): QueryBuilder {
    const found = this._findOneByQuery(query);
    const onExecute = async () => {
      if (found) {
        delete this._collection[found._id];
      }
      await this._sync();
    };
    return this._createQueryBuilder(found, onExecute);
  }

  /**
   * Deletes all documents that match the given query.
   *
   * @param query - The search query.
   * @returns A promise that resolves to an object containing the deleted count.
   */
  async deleteMany(
    query: Record<string, any>
  ): Promise<{ deletedCount: number }> {
    if (!query || Object.keys(query).length === 0) {
      const deletedCount = Object.keys(this._collection).length;
      for (const key in this._collection) {
        delete this._collection[key];
      }
      await this._sync();
      return { deletedCount };
    }
    const found = this._findAllByQuery(query);
    found.forEach((doc) => {
      delete this._collection[doc._id];
    });
    await this._sync();
    return { deletedCount: found.length };
  }

  private _findOneByQuery = (query: Record<string, any>) =>
    Object.values(this._collection).find((doc) =>
      Object.entries(query).every(([key, condition]) =>
        this._evaluateCondition(doc[key], condition)
      )
    );

  private _findAllByQuery = (query: Record<string, any>) =>
    Object.values(this._collection).filter((doc) =>
      Object.entries(query).every(([key, condition]) =>
        this._evaluateCondition(doc[key], condition)
      )
    );

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
