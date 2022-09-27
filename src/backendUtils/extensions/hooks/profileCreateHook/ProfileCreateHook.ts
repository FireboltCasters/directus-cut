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

    filter(
      EventHelper.USERS_LOGIN_EVENT,
      async (input: any, actionContext: any) => {
        console.log('FILTER: User logged in');
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

        console.log('profileCreateHook: User found: ' + userId);
        console.log('profile: ' + JSON.stringify(existingUser?.profile));
        if (existingUser?.profile) {
          console.log('profileCreateHook: User already has a profile');
          //user already has a profile
          return input;
        } else {
          console.log('profileCreateHook: User has no profile yet');
          //create a profile for the user
          const newProfiles = await database(tablename_profiles).insert({});
          //update the user
          console.log(
            'profileCreateHook: User newProfiles created: ' +
              JSON.stringify(newProfiles)
          );
          const newProfile = newProfiles[0];
          console.log(
            'profileCreateHook: User newProfile created: ' +
              JSON.stringify(newProfile)
          );
          if (newProfile) {
            let updatedUser = await database('directus_users')
              .where({id: userId})
              .update({profile: newProfile});
            console.log(
              'profileCreateHook: User updated: ' + JSON.stringify(updatedUser)
            );
            return input;
          }
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
