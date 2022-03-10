export default class StudIpCustomProviderLogin {
  static providerName = 'studip';

  static async providerLogin(
    uploadImageFunc: (arg0: any) => any,
    deleteImageFunc: (arg0: any) => any,
    existingUser: any,
    updatedUserInfos: any,
    userProfile: any,
    usersService: any
  ) {
    let title = '';
    const prefix = userProfile.name.prefix;
    const suffix = userProfile.name.suffix;

    title = prefix ? prefix : title;
    title = suffix ? suffix : title;

    const avatar_normal_url = userProfile.avatar_normal;
    if (existingUser?.id) {
      await deleteImageFunc(existingUser.id);
    }

    const avatar_filename = await uploadImageFunc(avatar_normal_url);

    let newUpdatedUserInfos = {
      first_name: userProfile.name.given,
      last_name: userProfile.name.family,
      email: userProfile.email,
      avatar: avatar_filename,
      title: title,
    };

    return newUpdatedUserInfos;
  }
}
