import TypeSpecificRegisterFunctions from '../../../helper/typeInterfaces/TypeSpecificRegisterFunctions';
import RegisterFunctionContext from '../../../helper/typeInterfaces/RegisterFunctionContext';
import EventHelper from '../EventHelper';

/**
 * A small hook, to create a profile upon user registration
 * You will need to create a table (e. G. "profiles") with a field "user" which relates to "directus_users"
 */

//TODO try catch init if database is not ready
//TODO init table profiles if not exists
//TODO check if field profile exists in directus_users

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
      //     async (input: any, actionContext: any) => { /** action */
      async (input: any, meta: any, actionContext: any) => {
        /** filter */
        const {database, schema, accountability} = actionContext;
        const currentProvider = input.provider; //get the current provider
        //        let userId = input.user; // action
        let userId = meta.user; // filter
        const existingUsers = await database('directus_users').where({
          id: userId,
        });
        const existingUser = existingUsers[0];
        if (!existingUser) {
          //handle no user found error
          // @ts-ignore
          throw new InvalidPayloadException(
            'profileCreateHook: No user found with id: ' + userId
          );
        }

        if (existingUser?.profile) {
          //user already has a profile
          return input;
        } else {
          //create a profile for the user
          try {
            const newProfiles = await database(tablename_profiles).insert({});
            //update the user
            const newProfile = newProfiles[0];
            if (newProfile) {
              let updatedUser = await database('directus_users')
                .where({id: userId})
                .update({profile: newProfile});
              return input;
            }
          } catch (e) {
            console.log(
              'profileCreateHook: Error while creating profile for user: ' +
                userId
            );
            console.log(e);
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
