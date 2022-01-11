import RedirectWithToken from '../backendUtils/extensions/endpoints/redirect-with-token/RedirectWithToken';

let refresh_token = 'directus_refresh_token' + Math.random() + '';
let redirect = 'redirect' + Math.random() + '';

let exampleReq = {
  cookies: {
    directus_refresh_token: refresh_token,
  },
  query: {
    redirect: redirect,
  },
};

let routerFunc: any = null;
let routerPath: string = '';
let router = {
  get: (path: any, func: any) => {
    routerPath = path;
    routerFunc = func;
  },
  mockRouting: (path: string, req: any, res: any) => {
    if (path === routerPath) {
      if (!!routerFunc) {
        try {
          routerFunc(req, res);
          return true;
        } catch (err) {
          console.log(err);
        } finally {
          return false;
        }
      }
    }
    return false;
  },
};

test('Set a user to an admin', async () => {
  RedirectWithToken.registerEndpoint(router);

  let resultingRedirectURL = null;
  let exampleRes = {
    redirect: (redirectURL: string) => {
      resultingRedirectURL = redirectURL;
    },
  };

  let expectingRedirectURL = redirect + refresh_token;

  router.mockRouting('/', exampleReq, exampleRes);
  expect(resultingRedirectURL).toBeTruthy();
  expect(resultingRedirectURL).toBe(expectingRedirectURL);
});
