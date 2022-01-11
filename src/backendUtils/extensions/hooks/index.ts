import AvatarDeleteCascadeHook from './avatarDeleteCascade/AvatarDeleteCascadeHook';
import UpdateSSOUsersHook from "./updateSSOUsers/UpdateSSOUsersHook";
import StudIpCustomProviderLogin from "./updateSSOUsers/StudIpCustomProviderLogin";

export default class BackendHooks {
  static AvatarDeleteCascadeHook = AvatarDeleteCascadeHook;
  static UpdateSSOUsersHook = UpdateSSOUsersHook;
  static StudIpCustomProviderLogin = StudIpCustomProviderLogin;
}
