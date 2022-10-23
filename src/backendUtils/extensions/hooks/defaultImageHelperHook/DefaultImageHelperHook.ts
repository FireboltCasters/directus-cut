/**
 * Delete Images if item gets deleted hook
 */
import ImageResizeHook from "../imageResizeHook/ImageResizeHook";
import ImageBase64UploadHook from "../imageBase64UploadHook/ImageBase64UploadHook";
import FileDeleteCascadeHook from "../fileDeleteCascade/FileDeleteCascadeHook";
import FileUpdateDeleteCascadeHook from "../fileUpdateDeleteCascade/FileUpdateDeleteCascadeHook";

export default class DefaultImageHelperHook {

  private static async beforeUpdateHook(collection_name: string, file_field_name: string, payload: any, input: any, database: any, schema: any, accountability: any, registerFunctions: any, context: any){
    console.log("Before Update");
    return payload;
  }

  static registerHookSingleCollection(collection_name: string, file_field_name: string, registerFunctions: any, context: any){
    let imageResizeAfterBaseImportHook = ImageResizeHook.registerHook.bind(null, null, null);

    let before = DefaultImageHelperHook.beforeUpdateHook;
    let after = ImageBase64UploadHook.registerHook.bind(null, null, imageResizeAfterBaseImportHook);

    FileDeleteCascadeHook.handleHook(collection_name, file_field_name, registerFunctions, context);
    FileUpdateDeleteCascadeHook.handleHook(collection_name, file_field_name, before, after, registerFunctions, context);
  }

  /**
   * Register this hook to delete files when item with files is deleted
   * @param collection_name the collection name
   * @param file_field_name the field name of the file
   */
  static registerHook(collection_names: string[], file_field_name: string, registerFunctions: any, context: any) {
    for (let collection_name of collection_names) {
      DefaultImageHelperHook.registerHookSingleCollection(collection_name, file_field_name, registerFunctions, context);
    }
  }

}
