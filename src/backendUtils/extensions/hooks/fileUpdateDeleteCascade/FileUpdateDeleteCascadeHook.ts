/**
 * Delete Images if item gets deleted hook
 */
import AvatarHelper from '../../../helper/AvatarHelper';
import TypeSpecificRegisterFunctions from '../../../helper/typeInterfaces/TypeSpecificRegisterFunctions';
import RegisterFunctionContext from '../../../helper/typeInterfaces/RegisterFunctionContext';

export default class FileUpdateDeleteCascadeHook {
  /**
   * Register this hook to delete files when item is updated
   * @param collection_name the collection name
   * @param file_field_name the field name of the file
   * @param beforeDelete [optional] a hook before the deletion of the file. Must return payload (collection_name, file_field_name, payload, input, registerFunctions, context)
   * @param afterDelete [optional] a hook after the deletion of the file. Must return payload (collection_name, file_field_name, payload, input, registerFunctions, context)
   */
  static registerHook(collection_name: string, file_field_name: string, beforeDelete?: any, afterDelete?: any) {
    return FileUpdateDeleteCascadeHook.handleHook.bind(
      null,
      collection_name,
      file_field_name,
      beforeDelete,
      afterDelete
    );
  }

  static handleHook(
    collection_name: string,
    file_field_name: string,
    beforeDelete: any,
    afterDelete: any,
    registerFunctions: TypeSpecificRegisterFunctions,
    context: RegisterFunctionContext
  ) {
    registerFunctions.filter(
      collection_name + '.items.update',
      // @ts-ignore
      async (payload: any, input: any, {database, schema, accountability}) => {
        if (file_field_name in payload) {
          //is our searched key updated (value can be null!)
          const collectionIds = input.keys; // get all items which get updated

          if (!!beforeDelete) {
            payload = await beforeDelete(
              collection_name,
              file_field_name,
              payload,
              input,
              registerFunctions,
              context
            );
          }

          for (const collectionId of collectionIds) { // for item which gets updated

            await AvatarHelper.deleteFileOfCollection(
              context.services,
              database,
              schema,
              accountability,
              context.exceptions,
              collection_name,
              file_field_name,
              collectionId
            ); //delete file
          }

          if (!!afterDelete) {
            payload = await afterDelete(
              collection_name,
              file_field_name,
              payload,
              input,
              registerFunctions,
              context
            );
          }
        }

        return payload;
      }
    );
  }
}
