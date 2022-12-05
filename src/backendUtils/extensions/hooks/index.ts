import AvatarDeleteCascadeHook from './avatarDeleteCascade/AvatarDeleteCascadeHook';
import UpdateSSOUsersHook from './updateSSOUsers/UpdateSSOUsersHook';
import StudIpCustomProviderLogin from './updateSSOUsers/StudIpCustomProviderLogin';
import FileDeleteCascadeHook from './fileDeleteCascade/FileDeleteCascadeHook';
import FileUpdateDeleteCascadeHook from './fileUpdateDeleteCascade/FileUpdateDeleteCascadeHook';
import ProfileCreateHook from './profileCreateHook/ProfileCreateHook';
import DefaultImageHelperHook from './defaultImageHelperHook/DefaultImageHelperHook';
import ImageBase64UploadHook from './imageBase64UploadHook/ImageBase64UploadHook';
import ImageResizeHook from './imageResizeHook/ImageResizeHook';
import UniqueFieldsCombinationHook from './uniqueFieldsCombinationHook/UniqueFieldsCombinationHook';

export default class BackendHooks {
  static AvatarDeleteCascadeHook = AvatarDeleteCascadeHook;
  static FileDeleteCascadeHook = FileDeleteCascadeHook;
  static FileUpdateDeleteCascadeHook = FileUpdateDeleteCascadeHook;
  static UpdateSSOUsersHook = UpdateSSOUsersHook;
  static StudIpCustomProviderLogin = StudIpCustomProviderLogin;
  static ProfileCreateHook = ProfileCreateHook;
  static UniqueFieldsCombinationHook = UniqueFieldsCombinationHook;

  static ImageBase64UploadHook = ImageBase64UploadHook;
  static ImageResizeHook = ImageResizeHook;
  static DefaultImageHelperHook = DefaultImageHelperHook;
}
