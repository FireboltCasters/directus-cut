import TypeSpecificRegisterFunctions from '../../../helper/typeInterfaces/TypeSpecificRegisterFunctions';
import RegisterFunctionContext from '../../../helper/typeInterfaces/RegisterFunctionContext';
import FolderHelper from '../../../helper/FolderHelper';
import AvatarHelper from '../../../helper/AvatarHelper';
import ProfileHelper from '../../../helper/ProfileHelper';
import ActionContextInterface from '../../../helper/typeInterfaces/ActionContextInterface';
import EventHelper from "../EventHelper";

export default class UpdateSSOUsersHook {
  static registerHook(mappingOfProviderNameToHandler: any) {
    return UpdateSSOUsersHook.handleHook.bind(
      null,
      mappingOfProviderNameToHandler
    );
  }

  private static handleHook(
    mappingOfProviderNameToHandler: any,
    registerFunctions: TypeSpecificRegisterFunctions,
    context: RegisterFunctionContext
  ) {
    registerFunctions.action(
        EventHelper.USERS_LOGIN_EVENT,
      async (input: any, actionContext: ActionContextInterface) => {
        const database = actionContext.database;
        const schema = actionContext.schema;
        const accountability = actionContext.accountability;

        // create a folder where to place the images of users
        const avatar_image_folder =
          await FolderHelper.getOrCreateFolderIdByName(
            context.services,
            database,
            schema,
            accountability,
            context.exceptions,
            'avatar_images'
          );

        //bind the upload function
        const uploadImageFunc = AvatarHelper.uploadImageByURL.bind(
          null,
          context.services,
          database,
          schema,
          accountability,
          context.exceptions,
          avatar_image_folder
        );
        const deleteImageFunc = AvatarHelper.deleteAvatarOfUser.bind(
          null,
          context.services,
          database,
          schema,
          accountability,
          context.exceptions
        );

        const currentProvider = input.provider; //get the current provider
        const customProviderHandler =
          mappingOfProviderNameToHandler[currentProvider];
        if (customProviderHandler) {
          //TODO maybe add more provider handler here if needed
          const providerHandlerWithParams = customProviderHandler.bind(
            null,
            uploadImageFunc,
            deleteImageFunc
          ); //get the login hook
          await ProfileHelper.handleProviderLogin(
            input,
            database,
            schema,
            context.services,
            context.env,
            providerHandlerWithParams
          ); //register login hook
        }

        return input;
      }
    );
  }
}
