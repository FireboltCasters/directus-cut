import TypeSpecificRegisterFunctions from '../../../helper/typeInterfaces/TypeSpecificRegisterFunctions';
import RegisterFunctionContext from '../../../helper/typeInterfaces/RegisterFunctionContext';

type HookInput = {
  [collectionName: string]: {fields: string[]; message: string};
};

type Payload = {
  [key: string]: string | number | null;
};

type ItemWithId = {
  id: string | number;
};

export default class UniqueFieldsCombinationHook {
  /**
   * A hook that allows to define a set of fields of a collection where the combination of the values of these fields will only occur once.
   * E.g. if there is a collection that stores users with first_name and last_name but the collection should only contain one Max Mustermann
   *
   * This hooks also works on relational fields, which means that it is possible to look at a field that a relational field is pointing to.
   *
   * Hook input:
   * {
   *   "collectionName": {fields: ["field1", "field2.fieldOfOtherCollection", ...], message: "error message"},
   *   ...
   * }
   *
   * Examples:
   * {
   *   "users": {fields: ["first_name", "last_name"], message: "combination of firstname and lastname is not unique"}
   * }
   *
   */
  static registerHook(data: HookInput) {
    return UniqueFieldsCombinationHook.handleHook.bind(null, data);
  }

  static handleHook(
    data: HookInput,
    registerFunctions: TypeSpecificRegisterFunctions,
    context: RegisterFunctionContext
  ) {
    //@ts-ignore
    async function hookLogic(
      payload: any,
      meta: any,
      {database, schema, accountability}
    ) {
      const {event, collection} = meta;
      const keys = meta.keys as string[];

      if (!(collection in data)) return payload; //If the collection that is being worked on does not have restrictions, just pass the untouched payload

      //@ts-ignore
      const {ItemsService} = context.services;
      //@ts-ignore
      const {InvalidPayloadException} = context.exceptions;
      const collectionService = new ItemsService(collection, {
        schema: schema,
        knex: database,
      });
      const uniqueFields = data[collection].fields;
      const errorMessage = data[collection].message;

      /*
      STEP 1: FILL PAYLOAD
        The goal of this step is to create a payload where all necessary data is present because they original payload may not contain them.
        E.g. the payload for an edit request could just be something like this: { (keys: ["1"]), firstname: "newName" } but the restriction might state that
        every combination of firstname and lastname in the collection should be unique. Therefore we need to add the lastname information of the item, that
        is supposed to be updated, into the payload ({ firstname: "newName", lastname: "someLastName (fetched from collection)" })
        so we can then check if this combination already exists. We also want to remove payload data that is not relevant.
    */
      const payloadKeys = Object.keys(payload);
      const filteredPayload: Payload = {}; //This object will only contain data that is relevant for checking for uniqueness and was part of the original payload
      const flatUniqueFields = uniqueFields.map(field => field.split('.')[0]);
      for (const field in payload) {
        //@ts-ignore
        if (flatUniqueFields.includes(field)) {
          filteredPayload[field] = payload[field];
        }
      }

      //MissingProps contains all props that are missing from the payload but are needed for checking for uniqueness
      //If it's an create request, then the missing props will be filled with null, if it's and update request then the needed data will be fetched from the db
      //@ts-ignore
      const missingProps = uniqueFields.reduce<string[]>(
        (prev, current) =>
          payloadKeys.includes(current.split('.', 1)[0])
            ? prev
            : [...prev, current.split('.', 1)[0]],
        []
      );

      let filledPayloads: Payload[] = [];
      if (event === 'items.create') {
        filledPayloads = [
          missingProps.reduce<Payload>(
            (prev, current) => ({...prev, [current]: null}),
            {...filteredPayload}
          ),
        ];
      }

      if (event === 'items.update') {
        if (missingProps.length === uniqueFields.length) {
          return payload; //If none of the restricted fields gets updated, just let the request pass
        }
        if (keys.length > 1 && missingProps.length === 0) {
          //If keys.length > 1 means that there are multiple collection items that are supposed to be updated with the same payload
          //If at the same time there are no missing props in the payload
          //(which means that the payload contains all the fields that should be checked for uniqueness) it obviously results in a conflict
          throw new InvalidPayloadException(errorMessage);
        }
        if (missingProps.length > 0) {
          const items = (await collectionService.readMany(keys, {
            fields: ['id', ...missingProps],
          })) as ItemWithId[];
          keys.forEach(itemId => {
            const itemData = items.find(item => item.id === itemId);
            //@ts-ignore
            filledPayloads = [
              ...filledPayloads,
              missingProps.reduce(
                (prev, current) => ({...prev, [current]: itemData[current]}),
                {...filteredPayload, id: itemId}
              ),
            ];
          });
        } else {
          //This is only called if missingProps.length === 0 and keys.length === 1
          filledPayloads = [{...payload, id: keys[0]}];
        }
      }

      /*
      STEP 2: RESOLVE DEEP RELATIONS
        After step 1 we have a payload object that only contains the props that we need to check for conflicts. But since this hook allows to define 
        restrictions like this { "collectionName": {fields: ["field1.fieldOfOtherCollection", "..."]}} (where we actually want to "follow" the relations
        of an relational field and get the value of the item it's pointing to), we need to find out - for these kind of restriction - from which 
        collection we need to fetch the actual data and then send a request to that collection to retrieve the data.
    */
      const deepRelationExist = uniqueFields.some(
        field => field.split('.').length > 1
      );

      if (deepRelationExist) {
        const resolvedPayloads: Payload[] = [];
        for (const payloadItem of filledPayloads) {
          const resolvedData: Payload = {};
          for (const field of uniqueFields) {
            if (field.split('.').length === 1) {
              resolvedData[field] = payloadItem[field];
              continue;
            }

            const [firstField, ...restFields] = field.split('.');
            const restField = restFields.join('.');

          //@ts-ignore
            const collectionOfRelation = schema.relations.find(
              rel => rel.collection === collection && rel.field === firstField
            )['schema']['foreign_key_table'];
          //@ts-ignore
            const relationService = new ItemsService(collectionOfRelation, {
              schema: schema,
              knex: database,
            });

            const data = await relationService.readOne(
              payloadItem[firstField],
              {fields: [restField]}
            );
            const value = getNestedValue(data, restField);

            resolvedData[field] = value;
          }
          resolvedPayloads.push(resolvedData);
        }
        filledPayloads = resolvedPayloads;
      }

      /*
      STEP 3: CHECK FOR DUPLICATES
        After step 1 we now have a payload that only contains the props we need and also the fetched data from the nested restrictions, which means that
        filledPayloads has all the data that should not occur in exactly this combination in the database.
        So the last step is to send a query to the database and check if there is an item in the collection that has exactly these values.
        If there is, then the request should be requested. If not, then the request can pass.
    */
      const payloadsHasDuplicates = hasDuplicates(filledPayloads);
      if (payloadsHasDuplicates) {
        //If there are payloads that are the same, that means that it will create conflicts, so the request can be rejected without checking the database
        throw new InvalidPayloadException(errorMessage);
      }

      for (const payloadItem of filledPayloads) {
        const duplicatesInCollection = await collectionService.readByQuery({
          filter: createFilterObject(payloadItem, keys),
          fields: ['id'],
        });
        if (duplicatesInCollection.length > 0) {
          throw new InvalidPayloadException(errorMessage);
        }
      }

      return payload;
    }

    registerFunctions.filter('items.create', hookLogic);

    registerFunctions.filter('items.update', hookLogic);
  }
}

//Helperfunctions

const getNestedValue = (nestedData: any, path: string) => {
  const pathSteps = path.split('.');
  let temp = nestedData;
  pathSteps.forEach(step => {
    temp = temp[step];
  });

  return temp;
};

const hasDuplicates = (payloads: Payload[]) => {
  if (payloads.length <= 1) return false;

  return (
    new Set(payloads.map(payload => JSON.stringify(payload))).size !==
    payloads.length
  );
};

const createFilterObject = (payload: Payload, keys: string[]) => {
  const filterElements = () => {
    return Object.keys(payload).map(field => {
      const conditionPart =
        payload[field] === null ? {_null: true} : {_eq: payload[field]};
      const fieldPath = field.split('.');

      let filterElement = {};
      for (let i = fieldPath.length - 1; i >= 0; i--) {
        const path = fieldPath[i];
        if (i === fieldPath.length - 1) {
          filterElement = {[path]: conditionPart};
          continue;
        }

        filterElement = {[path]: filterElement};
      }

      return filterElement;
    });
  };

  return keys
    ? {
        _and: [
          {
            id: {
              _nin: keys,
            },
          },
          ...filterElements(),
        ],
      }
    : {_and: filterElements()};
};
