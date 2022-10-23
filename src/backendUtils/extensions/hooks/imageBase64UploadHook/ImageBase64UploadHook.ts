/**
 * Delete Images if item gets deleted hook
 */
const {toArray} = require('@directus/shared/utils');

export default class ImageBase64UploadHook {
  // Source: http://stackoverflow.com/questions/20267939/nodejs-write-base64-image-file
  static decodeBase64Image(dataString: string) {
    let matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let response = {
      type: undefined,
      data: undefined,
      extension: undefined,
    };

    if (!matches || matches.length !== 3) {
      return new Error('Invalid input string');
    }

    let extension = dataString.substring(
      dataString.indexOf('/') + 1,
      dataString.indexOf(';base64')
    );

    // @ts-ignore
    response.type = matches[1];
    // @ts-ignore
    response.data = new Buffer.from(matches[2], 'base64');
    // @ts-ignore
    response.extension = extension;

    return response;
  }

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
    console.log('After Update');

    let storageName = toArray(context.env.STORAGE_LOCATIONS)[0];

    let services = context.services;
    const {FilesService, FieldsService} = services;

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

    let image = JSON.parse(JSON.stringify(payload[file_field_name]));
    console.log('image:' + image?.length);
    if (!!image) {
      console.log('Image is not empty');

      if (typeof image === 'string' && image.startsWith('data')) {
        console.log('It is a base64 data');

        payload[file_field_name] = null; //when base64 string we need to reset it

        let body = {
          folder: null,
          type: 'image/png',
          storage: storageName,
          filename_download: 'test.png',
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

        console.log('DecodeBase64');
        let decodedObj = ImageBase64UploadHook.decodeBase64Image(image);
        console.log('Upload image');
        // @ts-ignore
        body.type = decodedObj?.type;
        // @ts-ignore
        body.filename_download = 'test' + '.' + decodedObj?.extension;
        //TODO get the ID of the object and set proper name
        // @ts-ignore
        let imageBuffer = decodedObj?.data;
        try {
          console.log(body);
          const filename = await filesService.uploadOne(imageBuffer, body);
          console.log('filename');
          console.log(filename);
          payload.image = filename;
        } catch (err) {
          console.log(err);
        }
      } else {
        console.log('It is not a base64');
        console.log(image.substring(0, 20));
        //TODO: set payload to current value
      }
    }

    console.log('Image Base64 Parser Hook finished with result: ');
    console.log(payload);

    if (!!afterHook) {
      payload = await afterHook(
        collection_name,
        file_field_name,
        payload,
        input,
        database,
        schema,
        accountability,
        registerFunctions,
        context
      );
    }

    return payload;
  }
}
