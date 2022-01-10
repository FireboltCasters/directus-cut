/**
 Create the file: extensions/endpoints/redirect-with-token/index.js

 const directusCut = require('directus-cut');
 module.exports = function registerEndpoint(router) {
    directusCut.RedirectWithToken.configureRouter(router);
 };

 For example: https://<PUBLIC_URL>/api/auth/login/<AUTH_PROVIDER>?redirect=https://<PUBLIC_URL>/api/redirect-with-token?redirect=http://localhost?access_token=
 This will get the access_token and will redirect the user to:
 http://localhost?access_token=XXXXXXXXX
 */
export default class RedirectWithToken {
  static configureRouter(router: any) {
    router.get('/', (req: any, res: any) => {
      let refresh_token = req.cookies.directus_refresh_token;
      let redirect = req.query.redirect;
      let redirectURL = redirect+refresh_token;
      res.redirect(redirectURL);
    });
  }
}
