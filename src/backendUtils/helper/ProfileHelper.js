const openIDClient = require('openid-client');


export default class ProfileHelper{
/**
 *
 * @param userId The user id
 * @param provider The provider name
 * @param database the database from the registered hook
 * @param env the environment from the registered hook/directus instance
 * @returns {Promise<*>} Returns the Userprofile from the Auth2 instance
 */
 async static getUserProfile(userId, provider, database, env){
  //lets get the existing user first
  const existingUser = await database("directus_users")
      .where({ id: userId })
      .first();

  let providerUppercase = provider.toUpperCase(); //provider name to Capital letters, thats how its in the env file

  // follow the same way as directus https://github.com/directus/directus/blob/main/api/src/auth/drivers/oauth2.ts
  const  { Issuer } = openIDClient;

  let auth_data = existingUser.auth_data;
  let tokenSet = auth_data;

  //getting configurations / credentials
  let envPre = "AUTH_";
  let clientId = env[envPre+providerUppercase+"_CLIENT_ID"];
  let clientSecret = env[envPre+providerUppercase+"_CLIENT_SECRET"];
  let authorizeUrl = env[envPre+providerUppercase+"_AUTHORIZE_URL"];
  let accessUrl = env[envPre+providerUppercase+"_ACCESS_URL"];
  let profileUrl = env[envPre+providerUppercase+"_PROFILE_URL"];
  let additionalConfig = {provider: provider};

  let issuer = new Issuer({
    authorization_endpoint: authorizeUrl,
    token_endpoint: accessUrl,
    userinfo_endpoint: profileUrl,
    issuer: additionalConfig.provider,
  });

  //combine the redirect url
  let urlSegments = [env.PUBLIC_URL,'auth','login', additionalConfig.provider, 'callback']
  let redirectUrl = urlSegments.join('/');

  //create the client
  let client = new issuer.Client({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: [redirectUrl],
    response_types: ['code'],
  });

  //get the user profile from the remote auth2 instance
  let userInfo = await client.userinfo(tokenSet);
  console.log(userInfo);

  return userInfo;
}

/**
 * Handle the provider login and allow a hook function to be called to alter the profile informations
 * @param shouldBeProvider for example "studip"
 * @param input input from the registered hook
 * @param database database from the registered hook
 * @param schema schema from the registered hook
 * @param services services from the registered hook
 * @param env env from the registered hook
 * @param hookUpdateUserInformation your callback / hook function to alter the informations: (existingUser, updatedUserInfos, userProfile, usersService) return updatedUserInfos
 * @returns {Promise<null|boolean>}
 */
 async static handleProviderLogin(input, database, schema, services, env, hookUpdateUserInformation){
  const { UsersService } = services;
  if(!!hookUpdateUserInformation){ //check if hook function is provided
    let currentProvider = input.provider; //get the current provider
    let userId = input.user;
      let existingUser = await database("directus_users") //get the user
          .where({ id: userId })
          .first();
      if(!!existingUser){
          let userProfile = await ProfileHelper.getUserProfile(userId, currentProvider, database, env); //get the remote user profile
          const usersService = new UsersService({ schema, knex: database }); //get the directus user service
          let updatedUserInfos = {}; //create empty user informations
          updatedUserInfos = await hookUpdateUserInformation(existingUser, updatedUserInfos, userProfile, usersService); //call hook function
          if(!!updatedUserInfos) { //if updated user information found
            await usersService.updateOne(userId, updatedUserInfos); //update them
          }
          return updatedUserInfos;
      }
    }

  return null;
}

}