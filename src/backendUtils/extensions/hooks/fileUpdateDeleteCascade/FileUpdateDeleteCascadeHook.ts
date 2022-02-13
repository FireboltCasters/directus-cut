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
   */
  static registerHook(collection_name: string, file_field_name: string) {
    return FileUpdateDeleteCascadeHook.handleHook.bind(
      null,
      collection_name,
      file_field_name
    );
  }

  private static handleHook(
    collection_name: string,
    file_field_name: string,
    registerFunctions: TypeSpecificRegisterFunctions,
    context: RegisterFunctionContext
  ) {
    registerFunctions.filter(
      collection_name + '.items.update',
      // @ts-ignore
      async (payload: any, input: any, {database, schema, accountability}) => {
        if (file_field_name in payload) { //is our searched key updated (value can be null!)
          let collectionIds = input.keys;
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
        }

        return payload;
      }
    );
  }
}
