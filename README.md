# @stephanullmann/mockgoose

A lightweight mock of essential Mongoose features designed specifically for **StackBlitz WebContainers**.

## Why?

Standard MongoDB and Mongoose connections don't work inside browser-based WebContainers. Solutions like `mongodb-memory-server` require native binaries that are also unsupported in that environment. 

`mockgoose` solves this by mocking the Mongoose API (Schemas, Models, Queries) and persisting data to simple `.json` files in a local `.mockgoose` directory.

## Features

- **Familiar API**: Create Schemas and Models just like in Mongoose.
- **Persistence**: Automatically saves data to `.mockgoose/**/*.json` sorted by collection.
- **WebContainer Compatible**: Pure JavaScript/TypeScript, no binaries required.
- **Query Support**: Supports common operations like `find`, `findOne`, `create`, `updateOne`, `deleteOne`, etc.

## Installation

```bash
npm install @stephanullmann/mockgoose
```

## Basic Usage

```typescript
import { connect, Schema, model } from '@stephanullmann/mockgoose';

await connect('mongodb://localhost:27017/myapp'); // The URI is ignored, but setup is performed

//  Define a Schema
const userSchema = new Schema({
  name: String,
  email: { type: String, required: true },
  age: Number
});

//  Create a Model
const User = model('User', userSchema);

//  Use it like Mongoose
async function run() {
  // Create
  const newUser = await User.create({ 
    name: 'Guybrush Threeepwood', 
    email: 'mighty@pirate.gov', 
    age: 24 
  });

  // Read
  const users = await User.find({ age: { $gte: 18 } });
  
  // Update
  await User.updateOne({ _id: newUser._id }, { age: 31 });

  // Delete
  await User.deleteOne({ _id: newUser._id });
}
```

## Supported Features

`mockgoose` aims to support the most common Mongoose operations, but it is not a 1:1 replacement.

### Current Limitations:
- **Schema Validation**: Basic schema structure is supported, but strict validation (required, min/max, custom validators) is not yet implemented.
- **Typescript**: Basic type inference is available, but complex Mongoose Document types are not supported.
- **Advanced Queries**: Features like **Aggregation Pipelines**, and complex `populate` calls are currently not supported or have limited support.
- **Connection**: `connect()` is present for API compatibility but ignores the connection string.

## Storage

Data is stored in the root of your project:
```text
.mockgoose/
  ├── Users.json
  └── Books.json
```
