import {DateTime} from 'luxon';
import DBImplementation from './DBImplementation';
import DBFrontend from './DBFrontend';
import DBBackend from './DBBackend';

// possible directus field types
type FieldType =
  | 'alias'
  | 'array'
  | 'binary'
  | 'boolean'
  | 'datetime'
  | 'date'
  | 'time'
  | 'file'
  | 'group'
  | 'hash'
  | 'integer'
  | 'decimal'
  | 'json'
  | 'lang'
  | 'm2o'
  | 'o2m'
  | 'slug'
  | 'sort'
  | 'status'
  | 'string'
  | 'translation'
  | 'uuid'
  | 'datetime_created'
  | 'datetime_updated'
  | 'user_created'
  | 'user_updated';

// possible directus operations
type Operation = 'create' | 'read' | 'update' | 'delete';

// collection => field name => associationTableName
type RelationsMap = {[collection: string]: {[field: string]: string}};

// junctionTableName + firstTableName => firstForeignKey, secondTableName => secondForeignKey
type JunctionData = {name: string; foreignKeys: {[key: string]: string}};

// firstTableName:secondTableName => junctionTableName + firstTableName => firstForeignKey, secondTableName => secondForeignKey
type JunctionMap = {[key: string]: JunctionData[]};

// role => collection => operation => allowed fields names
type PermissionsMap = {
  [role: string]: {[collection: string]: {[op in Operation]?: string[]}};
};

// collection => field name => type of field
type FieldTypesMap = {[collection: string]: {[fieldName: string]: FieldType}};

// convert field to resource type
type ToTypeConverter = (value: any) => any;

// convert resource type to field
type ToFieldConverter = (value: any) => any;

// compare resource types
type Comparator = (first: any, second: any) => boolean;

// field type => conversion function, e.g. "true" => true or "12.12.22" => DateTime
type FieldToTypeMap = {[type in FieldType]?: ToTypeConverter};

// field type => conversion function, e.g. true => "true" or DateTime => "12.12.22"
type TypeToFieldMap = {[type in FieldType]?: ToFieldConverter};

// field type => comparison function, true if equal, else false
type TypeCompareMap = {[type in FieldType]?: Comparator};

// register type data
type DataType = {
  types: FieldType[];
  fieldToType: ToTypeConverter;
  typeToField: ToFieldConverter;
  comparator: Comparator;
};

export default class CUTResource<T> {
  // external api
  private static instance: DBImplementation;
  private static get database(): DBImplementation {
    if (!CUTResource.instance) {
      throw Error(
        '[CUTResource] Database implementation not initialized. Use init() first'
      );
    }
    return CUTResource.instance;
  }

  static initFrontend(database: any) {
    CUTResource.instance = new DBFrontend(database);
  }

  static initBackend(database: any) {
    console.warn(
      '[CUTResource] Using backend implementation, this is not fully implemented yet'
    );
    CUTResource.instance = new DBBackend(database);
  }

  // private api
  private static initialized: boolean = false;

  private static relations: RelationsMap = {};
  private static fieldTypes: FieldTypesMap = {};
  private static fieldPermissionsByRole: PermissionsMap = {};
  private static junctionTables: JunctionMap = {};

  private static fieldToTypes: FieldToTypeMap = {};
  private static typeToFields: TypeToFieldMap = {};
  private static typeComparisons: TypeCompareMap = {};

  private static defaultFieldToType = (value: any) => value;
  private static defaultTypeToField = (value: any) => value + '';
  private static defaultComparator = (first: any, second: any) =>
    first === second;

  private static registerTypes(dataType: DataType[]) {
    let dataTypes = [...dataType];
    for (let data of dataTypes) {
      let types = [...data.types];
      for (let type of types) {
        if (!!CUTResource.fieldToTypes[type]) {
          console.warn(
            '[CUTResource] Conversion function for ' +
              type +
              ' already exists and will be overwritten'
          );
        }
        CUTResource.fieldToTypes[type] = data.fieldToType;
        CUTResource.typeToFields[type] = data.typeToField;
        CUTResource.typeComparisons[type] = data.comparator;
      }
    }
  }

  private static registerDataTypes() {
    let booleanType: DataType = {
      types: ['boolean'],
      fieldToType: (value: any) => {
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true';
        }
        return !!value;
      },
      typeToField: (value: boolean) => {
        return value;
      },
      comparator: (first: any, second: any) => {
        return first === second;
      },
    };
    let dateTimeType: DataType = {
      types: [
        'datetime',
        'date',
        'time',
        'datetime_created',
        'datetime_updated',
      ],
      fieldToType: (value: any) => {
        if (typeof value === 'string') {
          let res = DateTime.fromISO(value);
          res = res.set({millisecond: 0});
          res = res.toLocal();
          return res;
        }
        return CUTResource.defaultFieldToType(value);
      },
      typeToField: (value: DateTime) => {
        return value.toISO();
      },
      comparator: (first: DateTime, second: DateTime) => {
        return first.equals(second);
      },
    };
    let integerType: DataType = {
      types: ['integer'],
      fieldToType: (value: any) => {
        if (typeof value === 'string') {
          return Number.parseInt(value);
        }
        return CUTResource.defaultFieldToType(value);
      },
      typeToField: (value: number) => {
        return value;
      },
      comparator: (first: number, second: number) => {
        return first === second;
      },
    };
    let floatType: DataType = {
      types: ['decimal'],
      fieldToType: (value: any) => {
        if (typeof value === 'string') {
          return Number.parseFloat(value);
        }
        return CUTResource.defaultFieldToType(value);
      },
      typeToField: (value: number) => {
        return value;
      },
      comparator: (first: number, second: number) => {
        return first === second;
      },
    };
    let jsonType: DataType = {
      types: ['json'],
      fieldToType: (value: any) => {
        if (typeof value === 'string') {
          return JSON.parse(value);
        }
        return CUTResource.defaultFieldToType(value);
      },
      typeToField: (value: any) => {
        return JSON.stringify(value);
      },
      comparator: (first: any, second: any) => {
        return JSON.stringify(first) === JSON.stringify(second);
      },
    };
    CUTResource.registerTypes([
      booleanType,
      dateTimeType,
      integerType,
      floatType,
      jsonType,
    ]);
  }

  private static async convert(
    collection: string,
    obj: any,
    mode: 'toResource' | 'toItem',
    isCreate: boolean = false
  ): Promise<any> {
    await CUTResource.loadMeta();
    let res: any = {};
    for (let key of Object.keys(obj)) {
      let value = obj[key];
      // directus won't accept the query if these keys are present
      if (
        !isCreate &&
        mode === 'toItem' &&
        collection === 'directus_users' &&
        (key === 'tfa_secret' ||
          key === 'provider' ||
          key === 'external_identifier')
      ) {
        continue;
      }
      if (value === null) {
        res[key] = null;
      } else if (value === undefined) {
        res[key] = undefined;
      } else {
        let type = CUTResource.fieldTypes[collection][key];
        let caster;
        if (mode === 'toResource') {
          caster =
            CUTResource.fieldToTypes[type] || CUTResource.defaultFieldToType;
        } else {
          caster =
            CUTResource.typeToFields[type] || CUTResource.defaultTypeToField;
        }
        res[key] = caster(value);
      }
    }
    return res;
  }

  private static async itemToResource(
    collection: string,
    item: any
  ): Promise<any> {
    return await CUTResource.convert(collection, item, 'toResource');
  }

  private static async resourceToItem(
    collection: string,
    resource: any,
    isCreate: boolean = false
  ): Promise<{[key: string]: string}> {
    return await CUTResource.convert(collection, resource, 'toItem', isCreate);
  }

  private static async loadMeta() {
    if (!CUTResource.initialized) {
      let fieldsData = await CUTResource.database.readMany('directus_fields');
      for (let data of fieldsData.data) {
        let collection = CUTResource.fieldTypes[data.collection] || {};
        collection[data.field] = data.type.toLowerCase();
        CUTResource.fieldTypes[data.collection] = collection;

        let foreignKeyTable = data.schema?.foreign_key_table;
        if (!!foreignKeyTable) {
          if (!CUTResource.relations[data.collection]) {
            CUTResource.relations[data.collection] = {};
          }
          if (!CUTResource.relations[data.collection][data.field]) {
            CUTResource.relations[data.collection][data.field] =
              foreignKeyTable;
          }
        }
      }
      for (let relationKey of Object.keys(CUTResource.relations)) {
        let foreignKeys = Object.keys(CUTResource.relations[relationKey]);
        if (foreignKeys.length < 2) {
          continue;
        }
        for (let i = 0; i < foreignKeys.length; i++) {
          for (let j = 0; j < foreignKeys.length; j++) {
            let firstKey = foreignKeys[i];
            let secondKey = foreignKeys[j];
            let firstTable = CUTResource.relations[relationKey][firstKey];
            let secondTable = CUTResource.relations[relationKey][secondKey];
            if (firstTable === secondTable) {
              continue;
            }
            let combinedKey = firstTable + ':' + secondTable;
            if (!CUTResource.junctionTables[combinedKey]) {
              CUTResource.junctionTables[combinedKey] = [];
            }
            CUTResource.junctionTables[combinedKey].push({
              name: relationKey,
              foreignKeys: {
                [`${firstTable}`]: firstKey,
                [`${secondTable}`]: secondKey,
              },
            });
          }
        }
      }
      let permissionsData = await CUTResource.database.readMany(
        'directus_permissions'
      );
      for (let data of permissionsData.data) {
        let role: string = data.role;
        let collection: string = data.collection;
        let action: Operation = data.action;
        if (!CUTResource.fieldPermissionsByRole[role]) {
          CUTResource.fieldPermissionsByRole[role] = {};
        }
        if (!CUTResource.fieldPermissionsByRole[role][collection]) {
          CUTResource.fieldPermissionsByRole[role][collection] = {};
        }
        let fields: string[] =
          data.fields instanceof Array ? data.fields : [data.fields];
        CUTResource.fieldPermissionsByRole[role][collection][action] = fields;
      }
      CUTResource.registerDataTypes();
      CUTResource.initialized = true;
    }
  }

  private static async filterFieldsByPermission(
    collection: string,
    operation: Operation,
    resourceData: any
  ): Promise<any> {
    await CUTResource.loadMeta();
    let isAdmin = await CUTResource.database.isCurrentUserAdmin();
    if (isAdmin) {
      return resourceData;
    }
    let role = await CUTResource.database.getCurrentUserRole();
    let allowedFields =
      CUTResource.fieldPermissionsByRole[role][collection][operation] || [];
    if (allowedFields.length === 1 && allowedFields[0] === '*') {
      return resourceData;
    }
    let res: any = {};
    for (let field of allowedFields) {
      let value = resourceData[field];
      if (value !== undefined && value !== null) {
        res[field] = value;
      }
    }
    return res;
  }

  private static areResourcesEqual(
    collection: string,
    first: any,
    second: any
  ): boolean {
    let keys = Object.keys(CUTResource.fieldTypes[collection]);
    for (let key of keys) {
      let firstValue = first[key];
      let secondValue = second[key];
      if (
        (firstValue === null && secondValue === null) ||
        (firstValue === undefined && secondValue === undefined)
      ) {
        continue;
      }
      if (firstValue !== undefined && firstValue !== null) {
        let isFirstArray = Array.isArray(firstValue);
        let isSecondArray = Array.isArray(secondValue);
        if (isFirstArray && isSecondArray) {
          if (firstValue.length !== secondValue.length) {
            return false;
          }
        } else if (
          (!isFirstArray && isSecondArray) ||
          (isFirstArray && !isSecondArray)
        ) {
          return false;
        }
        let type = CUTResource.fieldTypes[collection][key];
        let comparator =
          CUTResource.typeComparisons[type] || CUTResource.defaultComparator;
        if (!comparator(firstValue, secondValue)) {
          return false;
        }
      } else {
        if (!CUTResource.defaultComparator(firstValue, secondValue)) {
          return false;
        }
      }
    }
    return true;
  }

  private static async setItem(
    resource: CUTResource<any>,
    item: any,
    associationName: string = resource._collection
  ) {
    resource._itemResource = await CUTResource.itemToResource(
      associationName,
      item
    );
    resource._syncItemResource = await CUTResource.itemToResource(
      associationName,
      item
    );
  }

  // public api

  static async getAll<T>(
    collection: string,
    offset: number | null,
    limit: number | null,
    multiSortMeta: any | null,
    filterParams: object | null
  ): Promise<CUTResource<T>[]> {
    let res: CUTResource<T>[] = [];
    let all = await CUTResource.database.readMany(collection, {
      offset: offset,
      limit: limit,
      meta: multiSortMeta,
      filter: filterParams,
    });
    if (!all.data || all.data.length === 0) {
      return res;
    }
    for (let item of all.data) {
      let resource = new CUTResource<T>(collection);
      await CUTResource.setItem(resource, item);
      res.push(resource);
    }
    return res;
  }

  static async create<T>(
    collection: string,
    resourceData: any
  ): Promise<CUTResource<T> | null> {
    let resource = new CUTResource<T>(collection);
    let filtered = await CUTResource.filterFieldsByPermission(
      collection,
      'create',
      resourceData
    );
    let data = await CUTResource.resourceToItem(collection, filtered, true);
    let item = await CUTResource.database.createOne(collection, data);
    await CUTResource.setItem(resource, item);
    return resource;
  }

  private readonly _collection: string = '';
  private _itemResource: any;
  private _syncItemResource: any;

  get data(): T {
    return this._itemResource as T;
  }

  constructor(collection?: string) {
    if (collection !== undefined) {
      this._collection = collection;
    }
  }

  async load(primaryKey: number | string) {
    let item = await CUTResource.database.readOne(this._collection, primaryKey);
    await CUTResource.setItem(this, item);
  }

  isSynchronized(): boolean {
    if (!this._itemResource) {
      return false;
    }
    return CUTResource.areResourcesEqual(
      this._collection,
      this._itemResource,
      this._syncItemResource
    );
  }

  private async getOneToMany<T>(
    associationTableName: string,
    filterParams?: any
  ): Promise<CUTResource<T>[]> {
    let res: CUTResource<T>[] = [];
    let associationRelations = CUTResource.relations[associationTableName];
    let foreignKeys: {_or: any[]} = {_or: []};
    for (let key of Object.keys(associationRelations)) {
      foreignKeys._or.push({[`${key}`]: {_eq: this._itemResource.id}});
    }
    let filter = {_and: [foreignKeys]};
    if (!!filterParams) {
      filter._and.push(filterParams);
    }
    let associations = await CUTResource.database.readMany(
      associationTableName,
      {
        filter: filter,
      }
    );
    if (!!associations) {
      for (let item of associations.data) {
        let resource = new CUTResource<T>(associationTableName);
        await CUTResource.setItem(resource, item, associationTableName);
        res.push(resource);
      }
    }
    return res;
  }

  private async getManyToMany<T>(
    junctionTables: JunctionData[],
    associationTableName: string,
    filterParams?: any
  ): Promise<CUTResource<T>[]> {
    let res: CUTResource<T>[] = [];
    let resIDs: {[key: number]: boolean} = {};
    for (let junctionTable of junctionTables) {
      let junctionTableName = junctionTable.name;
      let junctionTableKeyThis = junctionTable.foreignKeys[this._collection];
      let junctionTableKeyAssociation =
        junctionTable.foreignKeys[associationTableName];
      let junctionAssociations = await CUTResource.database.readMany(
        junctionTableName,
        {
          filter: {[`${junctionTableKeyThis}`]: {_eq: this._itemResource.id}},
        }
      );
      let query: {_and: any[]} = {_and: [{_or: []}]};
      if (!!junctionAssociations && junctionAssociations.data.length > 0) {
        for (let junctionAssociation of junctionAssociations.data) {
          let associationID = junctionAssociation[junctionTableKeyAssociation];
          query._and[0]._or.push({id: {_eq: associationID}});
        }
      } else {
        return res;
      }
      if (!!filterParams) {
        query._and.push(filterParams);
      }
      let associations = await CUTResource.database.readMany(
        associationTableName,
        {
          filter: query,
        }
      );
      if (!!associations) {
        for (let item of associations.data) {
          let newID = item.id;
          if (!resIDs[newID]) {
            let resource = new CUTResource<T>(associationTableName);
            await CUTResource.setItem(resource, item, associationTableName);
            res.push(resource);
            resIDs[newID] = true;
          }
        }
      }
    }
    return res;
  }

  async getAssociations<T>(
    associationTableName: string,
    filterParams?: any
  ): Promise<CUTResource<T>[]> {
    await CUTResource.loadMeta();
    let junctionTables =
      CUTResource.junctionTables[this._collection + ':' + associationTableName];

    // probably a one to many relation, may still not exist, but we will handle that later
    if (!junctionTables) {
      return await this.getOneToMany(associationTableName, filterParams);
    }
    return await this.getManyToMany(
      junctionTables,
      associationTableName,
      filterParams
    );
  }

  private async addOneToMany<T>(
    associationTableName: string,
    associationResource: CUTResource<T>
  ): Promise<void> {
    let relation = CUTResource.relations[associationTableName];
    for (let key of Object.keys(relation)) {
      let collection = relation[key];
      if (collection === this._collection) {
        associationResource.setField(key, this._itemResource.id);
        await associationResource.save();
        break;
      }
    }
  }

  private async addManyToMany<T>(
    associationTableName: string,
    associationResource: CUTResource<T>
  ): Promise<void> {
    let relation = CUTResource.relations[associationTableName];
    let thisKey = '';
    let associationKey = '';
    for (let key of Object.keys(relation)) {
      let collection = relation[key];
      if (collection === this._collection) {
        thisKey = key;
      } else if (collection === associationResource._collection) {
        associationKey = key;
      }
    }
    if (thisKey !== '' && associationKey !== '') {
      let data = {
        [`${thisKey}`]: this._itemResource.id,
        [`${associationKey}`]: associationResource._itemResource.id,
      };
      await CUTResource.database.createOne(associationTableName, data);
    }
  }

  async addAssociation<T>(
    associationResource: CUTResource<T>,
    associationTableName?: string
  ): Promise<void> {
    await CUTResource.loadMeta();
    if (!associationTableName) {
      await this.addOneToMany(
        associationResource._collection,
        associationResource
      );
    } else {
      await this.addManyToMany(associationTableName, associationResource);
    }
  }

  async save() {
    let filtered = await CUTResource.filterFieldsByPermission(
      this._collection,
      'update',
      this._itemResource
    );
    let data = await CUTResource.resourceToItem(this._collection, filtered);
    let updatedItem = await CUTResource.database.updateOne(
      this._collection,
      this._itemResource.id,
      data
    );
    await CUTResource.setItem(this, updatedItem);
  }

  async delete(): Promise<boolean> {
    return await CUTResource.database.deleteOne(
      this._collection,
      this._itemResource.id
    );
  }

  reset() {
    for (let key of Object.keys(this._syncItemResource)) {
      this._itemResource[key] = this._syncItemResource[key];
    }
  }

  setField<T>(field: string, value: T) {
    this._itemResource[field] = value;
  }

  getField<T>(field: string): T {
    return this._itemResource[field];
  }
}
