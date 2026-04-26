import util from 'util';
import { DBState } from '../types/index.js';

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

  async save() {
    await this._sync();
    return this;
  }

  toJSON() {
    return this._data;
  }

  [util.inspect.custom]() {
    return JSON.stringify(this._data, null, 2);
  }
}
