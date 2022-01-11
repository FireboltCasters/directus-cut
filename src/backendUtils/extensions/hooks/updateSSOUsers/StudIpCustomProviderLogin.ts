export default class StudIpCustomProviderLogin {

  static providerName = "studip";

  static async providerLogin(uploadImageFunc: (arg0: any) => any, deleteImageFunc: (arg0: any) => any, existingUser: any, updatedUserInfos: any, userProfile: any, usersService: any) {
    let title = "";
    let prefix = userProfile.name.prefix;
    let suffix = userProfile.name.suffix;

    title = !!prefix ? prefix : title;
    title = !!suffix ? suffix : title;

    let avatar_normal_url = userProfile.avatar_normal;
    if(existingUser?.id){
      await deleteImageFunc(existingUser.id);
    }

    let avatar_filename = await uploadImageFunc(avatar_normal_url);

    updatedUserInfos = {
      first_name: userProfile.name.given,
      last_name: userProfile.name.family,
      email: userProfile.email,
      avatar: avatar_filename,
      title: title,
    };

    return updatedUserInfos;
  }

}
