/**
 * Helper for Account things
 */
import AvatarHelper from '../../../helper/AvatarHelper';
import TypeSpecificRegisterFunctions from '../../../helper/typeInterfaces/TypeSpecificRegisterFunctions';
import RegisterFunctionContext from '../../../helper/typeInterfaces/RegisterFunctionContext';

export default class FileUpdateDeleteCascadeHook {
  /**
   * A small hook to delete the avatar image before user deletion
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
          let newfilename = payload[file_field_name];
          if(!!newfilename){
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
