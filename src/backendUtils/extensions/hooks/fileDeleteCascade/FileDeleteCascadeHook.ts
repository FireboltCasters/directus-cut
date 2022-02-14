/**
 * Delete Images if item gets deleted hook
 */
import AvatarHelper from '../../../helper/AvatarHelper';
import TypeSpecificRegisterFunctions from '../../../helper/typeInterfaces/TypeSpecificRegisterFunctions';
import RegisterFunctionContext from '../../../helper/typeInterfaces/RegisterFunctionContext';

export default class FileDeleteCascadeHook {
  /**
   * Register this hook to delete files when item is deleted
   * @param collection_name the collection name
   * @param file_field_name the field name of the file
   */
  static registerHook(collection_name: string, file_field_name: string) {
    return FileDeleteCascadeHook.handleHook.bind(
      null,
      collection_name,
      file_field_name
    );
  }

  static handleHook(
    collection_name: string,
    file_field_name: string,
    registerFunctions: TypeSpecificRegisterFunctions,
    context: RegisterFunctionContext
  ) {
    registerFunctions.filter(
      collection_name + '.items.delete',
      // @ts-ignore
      async (payload: any, input: any, {database, schema, accountability}) => {
        const collectionIds = payload; //get the user ids
        for (const collectionId of collectionIds) {
          // for all users which get deleted
          await AvatarHelper.deleteFileOfCollection(
            context.services,
            database,
            schema,
            accountability,
            context.exceptions,
            collection_name,
            file_field_name,
            collectionId
          ); //delete avatar file
        }

        return payload;
      }
    );
  }
}
