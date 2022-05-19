import TypeSpecificRegisterFunctions from "../../../helper/typeInterfaces/TypeSpecificRegisterFunctions";
import RegisterFunctionContext from "../../../helper/typeInterfaces/RegisterFunctionContext";
import EventHelper from "../EventHelper";

/**
 * A small hook, to create a profile upon user registration
 * You will need to create a table (e. G. "profiles") with a field "user" which relates to "directus_users"
 */

const DEFAULT_PROFILE_TABLENAME = "profiles"

export default class ProfileCreateHook {

    static handleHook(
        tablename_profiles,
        registerFunctions: TypeSpecificRegisterFunctions,
        context: RegisterFunctionContext
    ) {
        const { filter, action, init, schedule } = registerFunctions;

            action(
                EventHelper.USERS_LOGIN_EVENT,
                async (input, actionContext) => {
                    const {database, schema, accountability} = actionContext;
                    const currentProvider = input.provider; //get the current provider
                    let userId = input.user;
                    const existingUser = await database('directus_users')
                        .where({id: userId})
                        .first(); //get user
                    if (!existingUser) {
                        //handle no user found error
                        throw new InvalidPayloadException(
                            'profileCreateHook: No user found with id: ' + userId
                        );
                    }

                    const existingProfile = await database(tablename_profiles)
                        .where({user: userId})
                        .first(); //get user
                    if (!existingProfile) {
                        const status_published = 'published';

                        let profile = {
                            user: userId,
                            status: status_published,
                        };
                        await database(tablename_profiles).insert(profile);
                    } else {
//                        console.log(existingProfile);
                    }

                    return input;
                }
            );

    }

    /**
     * Register the profile create hook
     * @param customProfileTablename you can specify the name of the profile tablename
     */
    static
    registerHook(customProfileTablename?)
    {
        let tablename = customProfileTablename || DEFAULT_PROFILE_TABLENAME;
        return ProfileCreateHook.handleHook.bind(null, tablename);
    }

}
