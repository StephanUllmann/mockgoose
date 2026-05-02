import util from 'util';
import { DBState } from '../types/index.js';

/**
 * Represents a document in the mock database.
 */
export default class Document {
  [key: string]: any;

  constructor(
    private _data: Record<string, any>, // Document only ever wraps ONE object
    private _dbState: DBState,
    private _sync: () => Promise<void> // Removed the dbState argumentid>
  ) {
    // Return a Proxy to map property access directly to the underlying data
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }
        return target._data[prop as string];
      },
      set(target, prop, value, receiver) {
        if (prop in target) {
          return Reflect.set(target, prop, value, receiver);
        }
        target._data[prop as string] = value;
        return true;
      },
    });
  }

  /**
   * Saves the current state of the document to the mock database.
   * 
   * @returns A promise that resolves to the document.
   */
  async save(): Promise<this> {
    await this._sync();
    return this;
  }

  /**
   * Converts the document to a plain JSON object.
   * 
   * @returns The document data as a JSON object.
   */
  toJSON(): Record<string, any> {
    return this._data;
  }

  /**
   * Converts the document to a plain object.
   * 
   * @returns The document data as a plain object.
   */
  toObject(): Record<string, any> {
    return this._data;
  }

  [util.inspect.custom](): string {
    return JSON.stringify(this._data, null, 2);
  }
}
