/**
 * A Helper for handling with folders
 */
import AccountHelper from './AccountHelper';

export default class FolderHelper {
  /**
   * Get the folder id of an existing or new created folder, by given name and parent_id
   * @param folder_name the name of the folder to be found or created
   * @param parent_id null if searching in root, else give the parent folder id
   * @returns {Promise<*|null|*>} returns the new created or found id of the folder
   */
  static async getOrCreateFolderIdByName(
    services,
    database,
    schema,
    accountability,
    exceptions,
    folder_name,
    parent_id
  ) {
    const {InvalidPayloadException} = exceptions;
    if (!folder_name) {
      //check if foldername given
      throw new InvalidPayloadException(
        'getOrCreateFolderIdByName: No folder_name provided'
      );
    }

    const folderService = FolderHelper.getAdminFolderServiceInstance(
      schema,
      accountability,
      services
    ); //get admin permission
    try {
      const folder_instances = await folderService.readByQuery({
        name: folder_name,
        parent: parent_id,
      }); //search for folder
      if (folder_instances.length === 0) {
        //no folder found
        const createdFolder = await folderService.createOne({
          name: folder_name,
          parent: parent_id,
        }); //create one
        return createdFolder; //return new folder id
      } else {
        //one or more folders found
        const folder_instance = folder_instances[0]; //select first found //TODO check if thats ok
        return folder_instance.id; //return folder id
      }
    } catch (err) {
      console.log(err);
      throw new InvalidPayloadException(
        'getOrCreateFolderIdByName: Unkown error: ' + err.toString()
      );
    }
  }

  /**
   * Get folderService instance with admin permission
   * @returns {*}
   */
  static getAdminFolderServiceInstance(schema, accountability, services) {
    const {FoldersService} = services;
    const adminAccountAbility =
      AccountHelper.getAdminAccountability(accountability);
    const foldersService = new FoldersService({
      schema,
      accountability: adminAccountAbility,
    });
    return foldersService;
  }
}
