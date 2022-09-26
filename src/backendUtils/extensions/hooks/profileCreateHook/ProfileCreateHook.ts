import TypeSpecificRegisterFunctions from '../../../helper/typeInterfaces/TypeSpecificRegisterFunctions';
import RegisterFunctionContext from '../../../helper/typeInterfaces/RegisterFunctionContext';
import EventHelper from '../EventHelper';

/**
 * A small hook, to create a profile upon user registration
 * You will need to create a table (e. G. "profiles") with a field "user" which relates to "directus_users"
 */

const DEFAULT_PROFILE_TABLENAME = 'profiles';

export default class ProfileCreateHook {
  static handleHook(
    tablename_profiles: string,
    registerFunctions: TypeSpecificRegisterFunctions,
    context: RegisterFunctionContext
  ) {
    const {filter, action, init, schedule} = registerFunctions;

    action(
      EventHelper.USERS_LOGIN_EVENT,
      async (input: any, actionContext: any) => {
        const {database, schema, accountability} = actionContext;
        const currentProvider = input.provider; //get the current provider
        let userId = input.user;
        const existingUser = await database('directus_users')
          .where({id: userId})
          .first(); //get user
        if (!existingUser) {
          //handle no user found error
          // @ts-ignore
          throw new InvalidPayloadException(
            'profileCreateHook: No user found with id: ' + userId
          );
        }

        if (existingUser.profile) {
          //user already has a profile
          return input;
        } else {
          //create a profile for the user
          const newProfile = await database(tablename_profiles)
            .insert({})
            .returning('*');
          //update the user
          await database('directus_users')
            .where({id: userId})
            .update({profile: newProfile[0].id});
          return input;
        }
      }
    );
  }

  /**
   * Register the profile create hook
   * @param customProfileTablename you can specify the name of the profile tablename
   */
  static registerHook(customProfileTablename?: any) {
    let tablename = customProfileTablename || DEFAULT_PROFILE_TABLENAME;
    return ProfileCreateHook.handleHook.bind(null, tablename);
  }
}
