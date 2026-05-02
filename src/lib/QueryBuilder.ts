// eslint-disable-next-line unicorn/no-thenable
import util from 'util';

type ExecuteCallback = () => void | Promise<void>;

/**
 * QueryBuilder class for building and executing queries on mock data.
 */
export default class QueryBuilder {
  private _limit?: number;
  private _skip: number = 0;
  private _isLean: boolean = false;
  private _sort: Record<string, 1 | -1>;

  constructor(
    private data: Record<string, any> | Record<string, any>[] | null,
    private schema: any,
    private refs: any,
    private documentFactory?: (data: Record<string, any>) => any,
    private onExecute?: ExecuteCallback
  ) {}

  /**
   * Populates a referenced field in the document.
   * 
   * @param path - The field path to populate.
   * @returns The QueryBuilder instance.
   */
  populate(path: string): this {
    const [field, _query] = path.split(' ');

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

  /**
   * Sets the lean option for the query.
   * 
   * @returns The QueryBuilder instance.
   */
  lean(): this {
    this._isLean = true;
    return this;
  }

  /**
   * Sets the skip option for the query.
   * 
   * @param val - The number of documents to skip.
   * @returns The QueryBuilder instance.
   */
  skip(val: number): this {
    this._skip = val;
    return this;
  }

  /**
   * Sets the limit option for the query.
   * 
   * @param val - The maximum number of documents to return.
   * @returns The QueryBuilder instance.
   */
  limit(val: number): this {
    this._limit = val;
    return this;
  }

  /**
   * Sets the sort option for the query.
   * 
   * @param arg - An object specifying the fields to sort by and the sort order (1 for ascending, -1 for descending).
   * @returns The QueryBuilder instance.
   */
  sort(arg?: Record<string, 1 | -1>): this {
    this._sort = arg;
    return this;
  }

  private _getResolvedData() {
    if (this.data === null || this.data === undefined) return null;

    let result = Array.isArray(this.data) ? [...this.data] : this.data;

    if (Array.isArray(result)) {
      // Sorting
      if (this._sort !== undefined && Object.keys(this._sort).length > 0) {
        const sortEntries = Object.entries(this._sort);

        result.sort((a, b) => {
          for (const [key, direction] of sortEntries) {
            let valA = a[key];
            let valB = b[key];

            if (valB == null) return 1 * direction;

            if (valA instanceof Date) valA = valA.getTime();
            if (valB instanceof Date) valB = valB.getTime();

            if (valA < valB) return -1 * direction;
            if (valA > valB) return 1 * direction;
          }

          return 0;
        });
      }

      // Pagination
      const parsedSkip = parseInt(this._skip as any, 10);
      const start = Number.isNaN(parsedSkip) ? 0 : Math.max(0, parsedSkip);

      let end: number | undefined = undefined;
      if (this._limit !== undefined && this._limit !== null) {
        const parsedLimit = parseInt(this._limit as any, 10);

        if (!Number.isNaN(parsedLimit) && parsedLimit > 0) {
          end = start + parsedLimit;
        }
      }

      result = result.slice(start, end);
    }

    // Lean
    if (!this._isLean && this.documentFactory) {
      if (Array.isArray(result)) {
        result = result.map((item) => this.documentFactory!(item));
      } else {
        result = this.documentFactory(result);
      }
    }

    return result;
  }

  /**
   * Executes the query and returns the results.
   * 
   * @returns A promise that resolves to the query results.
   */
  async exec(): Promise<Record<string, any> | Record<string, any>[]> {
    if (this.onExecute) {
      await this.onExecute();
    }
    return this._getResolvedData();
  }

  /**
   * Implementation of the thenable interface for the QueryBuilder.
   */
  then(
    onfulfilled?: ((value: any) => any) | null,
    onrejected?: ((reason: any) => any) | null
  ): Promise<any> {
    const executePromise = this.onExecute
      ? Promise.resolve(this.onExecute())
      : Promise.resolve();

    return executePromise
      .then(() => this._getResolvedData())
      .then(onfulfilled, onrejected);
  }

  /**
   * Returns the query data as a plain object.
   * 
   * @returns The query data.
   */
  toObject(): Record<string, any> {
    return this.data;
  }

  [util.inspect.custom](): string {
    return JSON.stringify(this._getResolvedData(), null, 2);
  }
}
