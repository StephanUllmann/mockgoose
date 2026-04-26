import type { Schema } from 'mongoose';
import util from 'util';

export default class QueryBuilder {
  private _limit?: number;
  private _skip: number = 0;
  private _isLean: boolean = false;

  constructor(
    private data: Record<string, any> | Record<string, any>[] | null,
    private schema: any,
    private refs: any,
    private documentFactory?: (data: Record<string, any>) => any
  ) {}

  populate(path: string) {
    const [field, query] = path.split(' ');

    const modelName = this.schema.definition?.[field]?.ref;

    if (!modelName) {
      console.warn(`Cannot populate '${field}': No ref found in schema.`);
      return this;
    }

    const docs = Array.isArray(this.data)
      ? this.data
      : this.data
        ? [this.data]
        : [];

    docs.forEach((doc) => {
      const fieldValue = doc[field];
      if (!fieldValue) return;
      const refCollection = this.refs[modelName];
      if (!refCollection) return;

      if (Array.isArray(fieldValue)) {
        doc[field] = fieldValue.map((id) => refCollection[id] || id);
      } else {
        doc[field] = refCollection[fieldValue] || fieldValue;
      }
    });

    return this;
  }

  lean() {
    this._isLean = true;
    return this;
  }

  skip(val: number) {
    this._skip = val;
    return this;
  }

  limit(val: number) {
    this._limit = val;
    return this;
  }

  private _getResolvedData() {
    if (this.data === null || this.data === undefined) return null;

    let result = this.data;

    if (Array.isArray(result)) {
      const end = this._limit ? this._skip + this._limit : undefined;
      result = result.slice(this._skip, end);
    }

    if (!this._isLean && this.documentFactory) {
      if (Array.isArray(result)) {
        result = result.map((item) => this.documentFactory!(item));
      } else {
        result = this.documentFactory(result);
      }
    }

    return result;
  }

  exec() {
    return Promise.resolve(this._getResolvedData());
  }

  then(
    onfulfilled?: ((value: any) => any) | null,
    onrejected?: ((reason: any) => any) | null
  ) {
    return Promise.resolve(this._getResolvedData()).then(
      onfulfilled,
      onrejected
    );
  }

  [util.inspect.custom]() {
    return JSON.stringify(this._getResolvedData(), null, 2);
  }
}
