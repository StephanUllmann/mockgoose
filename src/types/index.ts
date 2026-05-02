import type mongoose from 'mongoose';

/**
 * Represents a Mockgoose model.
 */
export interface MockgooseModel extends mongoose.Model<
  any,
  unknown,
  unknown,
  unknown,
  any,
  any,
  unknown
> {}

/**
 * Represents the state of the mock database.
 */
export type DBState = Record<string, any>;
