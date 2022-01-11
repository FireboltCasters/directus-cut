/**
 * Helps to delete or upload an image for a user
 */
import AccountHelper from "./AccountHelper";

export default class AvatarHelper{

  /**
   * Deletes the avatar file for a userId
   * @param userId the userId
   * @returns {Promise<void>}
   */
  static async deleteAvatarOfUser(services, database, schema, accountability, exceptions, userId){

    const filesService = AvatarHelper.getAdminFileServiceInstance(schema, accountability, services);
    const { InvalidPayloadException } = exceptions;
    if(!userId){
      throw new InvalidPayloadException("deleteAvatarOfUser: No userId provided: ");
    }

    const existingUser = await database("directus_users").where({ id: userId }).first(); //get user
    if(!existingUser){ //handle no user found error
      throw new InvalidPayloadException("deleteAvatarOfUser: No user found with id: "+userId);
    }

    const avatar_filename = existingUser.avatar; //get filename of avatar
    if(!!avatar_filename){ //if has image
      await filesService.deleteOne(avatar_filename); //delete file
    }
  }

  /**
   * Uploads an image by an url. Will return null if imageURL is null. Will return the image id
   * @param folder_id the folder in which the image should be put
   * @param imageURL a valid url of an image
   * @returns {Promise<*|null>} image id or null if imageURL is null
   */
  static async uploadImageByURL(services, database, schema, accountability, exceptions, folder_id, imageURL){
    const { InvalidPayloadException } = exceptions;
    const filesService = AvatarHelper.getAdminFileServiceInstance(schema, accountability, services);

    let body = null;
    if(!!folder_id){
      body = {folder: folder_id}
    }

    try{
      if(!!imageURL){
        let avatar_filename = await filesService.importOne(imageURL, body);
        return avatar_filename;
      }
    } catch (err){
      throw new InvalidPayloadException("uploadImageByURL: Error on import avatar: "+err.toString());
    }
    return null;
  }

  /**
   * get a fileService with admin permission
   * @returns {*}
   */
  static getAdminFileServiceInstance(schema, accountability, services){
    const { FilesService } = services;
    let adminAccountAbility = AccountHelper.getAdminAccountability(accountability);
    return new FilesService({schema, accountability: adminAccountAbility});
  }

}