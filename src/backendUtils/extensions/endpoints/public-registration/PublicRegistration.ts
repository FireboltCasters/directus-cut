import RegisterFunctionContext from "../../../helper/typeInterfaces/RegisterFunctionContext";
import AccountHelper from "../../../helper/AccountHelper";

/**
 Create the file: extensions/endpoints/public-registration/index.js

 const directusCut = require('directus-cut');
 module.exports = function registerEndpoint(router) {
    directusCut.PublicRegistration.configureRouter(router);
 };

 For example: POST https://<PUBLIC_URL>/api/public-registration
 this will create a new user depending on the given parameters
    email: string, password: string
 */
export default class PublicRegistration {
  private static configureRouter(
    router: any,
    context: RegisterFunctionContext
  ) {

    router.get('/active', (req: any, res: any) => {
      res.json({active: true})
    });

    router.post('/', async (req: any, res: any) => {
      let accountability = req.accountability;

      let body = req.body;
      let email = body?.email;
      let password = body?.password;

      let userService = PublicRegistration.getAdminUserServiceInstance(context.getSchema(), accountability, context.services);
      try{
        let result = await userService.createOne({email: email, password: password});
        res.json({data: result})
      } catch (err){
        res.setHeader('Content-Type', 'application/json');
        res.status(500);
        res.send({error: err});
      }
    });
  }

  static registerEndpoint() {
    return PublicRegistration.configureRouter.bind(null);
  }

  /**
   * get a fileService with admin permission
   * @returns {*}
   */
  static getAdminUserServiceInstance(schema: any, accountability: any, services: any) {
    const {UsersService} = services;
    const adminAccountAbility =
        AccountHelper.getAdminAccountability(accountability);
    return new UsersService({schema, accountability: adminAccountAbility});
  }
}
