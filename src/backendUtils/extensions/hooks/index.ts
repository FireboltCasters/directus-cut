import AvatarDeleteCascadeHook from './avatarDeleteCascade/AvatarDeleteCascadeHook';
import UpdateSSOUsersHook from './updateSSOUsers/UpdateSSOUsersHook';
import StudIpCustomProviderLogin from './updateSSOUsers/StudIpCustomProviderLogin';
import FileDeleteCascadeHook from './fileDeleteCascade/FileDeleteCascadeHook';
import FileUpdateDeleteCascadeHook from './fileUpdateDeleteCascade/FileUpdateDeleteCascadeHook';
import ProfileCreateHook from './profileCreateHook/ProfileCreateHook';

export default class BackendHooks {
  static AvatarDeleteCascadeHook = AvatarDeleteCascadeHook;
  static FileDeleteCascadeHook = FileDeleteCascadeHook;
  static FileUpdateDeleteCascadeHook = FileUpdateDeleteCascadeHook;
  static UpdateSSOUsersHook = UpdateSSOUsersHook;
  static StudIpCustomProviderLogin = StudIpCustomProviderLogin;
  static ProfileCreateHook = ProfileCreateHook;
}
