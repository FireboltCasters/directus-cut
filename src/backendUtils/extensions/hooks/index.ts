import AvatarDeleteCascadeHook from './avatarDeleteCascade/AvatarDeleteCascadeHook';
import UpdateSSOUsersHook from './updateSSOUsers/UpdateSSOUsersHook';
import StudIpCustomProviderLogin from './updateSSOUsers/StudIpCustomProviderLogin';
import FileDeleteCascadeHook from './fileDeleteCascade/FileDeleteCascadeHook';

export default class BackendHooks {
  static AvatarDeleteCascadeHook = AvatarDeleteCascadeHook;
  static FileDeleteCascadeHook = FileDeleteCascadeHook;
  static UpdateSSOUsersHook = UpdateSSOUsersHook;
  static StudIpCustomProviderLogin = StudIpCustomProviderLogin;
}
