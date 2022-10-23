/**
 * Delete Images if item gets deleted hook
 */

const sharp = require('sharp');
const storageObject = require('/directus/node_modules/directus/dist/storage.js');
const storage = storageObject.default;
console.log(storage);

export default class ImageResizeHook {
  static async registerHook(
    beforeHook: any,
    afterHook: any,
    collection_name: string,
    file_field_name: string,
    payload: any,
    input: any,
    database: any,
    schema: any,
    accountability: any,
    registerFunctions: any,
    context: any
  ) {
    console.log('Image Resize Hook');
    let imageId = payload[file_field_name];
    if (!!imageId) {
      console.log('Our ImageID is: ' + imageId);
      console.log('Okay we have to resize the given image');
      let services = context.services;
      const {FilesService, ItemsService, FieldsService} = services;

      const adminAccountAbility = JSON.parse(JSON.stringify(accountability)); //make a copy !
      adminAccountAbility.admin = true; //usefull if we realy want to upload something as admin

      let filesService = new FilesService({
        schema,
        accountability: adminAccountAbility,
      });
      let fieldsService = new FieldsService({
        schema,
        accountability: adminAccountAbility,
      });

      console.log('Okay now get ItemsService');
      let imageItem = await filesService.readOne(imageId);
      console.log('ImageItem');
      console.log(imageItem);

      let filename_disk = imageItem.filename_disk;
      console.log('filename_disk: ' + filename_disk);
      let storageName = imageItem.storage;
      console.log('storageName: ' + storageName);
      let filename_download = imageItem.filename_download;
      console.log('filename_download: ' + filename_download);
      const buffer = await storage.disk(storageName).getBuffer(filename_disk);
      console.log('Buffer');
      console.log(buffer);
      let content = buffer.content;
      console.log('resize with sharp');
      let resizedImageBuffer = await sharp(content)
        .resize(2048, 2048, {fit: 'inside'})
        .jpeg({quality: 80})
        .toBuffer();
      console.log('Image resized');
      console.log(resizedImageBuffer);

      console.log('upload with fileService');
      try {
        let body = {
          folder: null,
          type: 'image/png',
          storage: storageName,
          filename_download: filename_download,
        }; //TODO get the correct folder

        let collectionInfo = await fieldsService.readOne(
          collection_name,
          file_field_name
        );
        console.log(collectionInfo);
        let folder = collectionInfo?.meta?.options?.folder;
        if (!!folder) {
          body.folder = folder;
        }

        await filesService.deleteOne(imageId); //delete big old file
        const filename = await filesService.uploadOne(resizedImageBuffer, body);
        console.log('filename');
        console.log(filename);
        payload.image = filename;
      } catch (err) {
        console.log(err);
      }
      console.log('finished resizing');
    }

    return payload;
  }
}
