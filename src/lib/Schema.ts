import type {
  AddDefaultId,
  ApplySchemaOptions,
  BufferToBinary,
  Default__v,
  DefaultSchemaOptions,
  FlatRecord,
  FlattenMaps,
  HydratedDocument,
  IfAny,
  IfEquals,
  IsItRecordAndNotAny,
  Model,
  ObtainDocumentType,
  Require_id,
  ResolveSchemaOptions,
  SchemaDefinition,
  SchemaDefinitionType,
  SchemaOptions,
} from 'mongoose';
import { generateObjectId } from './utils/mockObjectId.js';

export default class Schema<
  RawDocType = any,
  TModelType = Model<RawDocType, any, any, any>,
  TInstanceMethods = {},
  TQueryHelpers = {},
  TVirtuals = {},
  TStaticMethods = {},
  TSchemaOptions = DefaultSchemaOptions,
  DocType extends ApplySchemaOptions<
    ObtainDocumentType<
      DocType,
      RawDocType,
      ResolveSchemaOptions<TSchemaOptions>
    >,
    ResolveSchemaOptions<TSchemaOptions>
  > = ApplySchemaOptions<
    ObtainDocumentType<any, RawDocType, ResolveSchemaOptions<TSchemaOptions>>,
    ResolveSchemaOptions<TSchemaOptions>
  >,
  THydratedDocumentType = HydratedDocument<
    DocType,
    AddDefaultId<DocType, TVirtuals, TSchemaOptions> & TInstanceMethods,
    TQueryHelpers,
    AddDefaultId<DocType, TVirtuals, TSchemaOptions>,
    IsItRecordAndNotAny<RawDocType> extends true ? RawDocType : DocType,
    ResolveSchemaOptions<TSchemaOptions>
  >,
  TSchemaDefinition = IfAny<
    RawDocType,
    unknown,
    SchemaDefinition<
      SchemaDefinitionType<RawDocType>,
      RawDocType,
      THydratedDocumentType
    >
  >,
  LeanResultType = IsItRecordAndNotAny<RawDocType> extends true
    ? RawDocType
    : Default__v<Require_id<BufferToBinary<FlattenMaps<DocType>>>>,
> {
  public static Types: {
    ObjectId: (str: string) => string;
  } = {
    ObjectId(str: string) {
      return generateObjectId();
    },
  };

  constructor(
    public definition?:
      | SchemaDefinition<
          SchemaDefinitionType<RawDocType>,
          RawDocType,
          THydratedDocumentType
        >
      | DocType,
    public options?:
      | SchemaOptions<
          FlatRecord<DocType>,
          TInstanceMethods,
          TQueryHelpers,
          TStaticMethods,
          TVirtuals,
          THydratedDocumentType,
          IfEquals<
            TModelType,
            Model<any, any, any, any>,
            Model<
              DocType,
              TQueryHelpers,
              TInstanceMethods,
              TVirtuals,
              THydratedDocumentType
            >,
            TModelType
          >
        >
      | ResolveSchemaOptions<TSchemaOptions>
  ) {}
}
