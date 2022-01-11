/**
 * Helper for Account things
 */
import AvatarHelper from '../../../helper/AvatarHelper';
import TypeSpecificRegisterFunctions from '../../../helper/typeInterfaces/TypeSpecificRegisterFunctions';
import RegisterFunctionContext from '../../../helper/typeInterfaces/RegisterFunctionContext';

export default class AvatarDeleteCascadeHook {
  /**
   * A small hook to delete the avatar image before user deletion
   */
  static registerHook(){
    return AvatarDeleteCascadeHook.handleHook;
  }


  private static handleHook(
    registerFunctions: TypeSpecificRegisterFunctions,
    context: RegisterFunctionContext
  ){
      registerFunctions.filter(
      'users.delete',
      // @ts-ignore
      async (payload: any, input: any, {database, schema, accountability}) => {
        let usersIds = payload; //get the user ids
        for (let userId of usersIds) {
          // for all users which get deleted
          await AvatarHelper.deleteAvatarOfUser(
            context.services,
            database,
            schema,
            accountability,
            context.exceptions,
            userId
          ); //delete avatar file
        }

        return payload;
      }
    );
  };
}
