import type mongoose from 'mongoose';

export interface MockgooseModel extends Partial<
  mongoose.Model<any, unknown, unknown, unknown, any, any, unknown>
> {}

export type DBState = Record<string, any>;
