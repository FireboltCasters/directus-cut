import RedirectWithToken from '../backendUtils/extensions/endpoints/redirect-with-token/RedirectWithToken';

const refresh_token = 'directus_refresh_token' + Math.random() + '';
const redirect = 'redirect' + Math.random() + '';
const allowedRoute = "/allowed/";
const listOfAllowedRedirects: string[] = [allowedRoute+"*"]

const exampleReq = {
  cookies: {
    directus_refresh_token: refresh_token,
  },
  query: {
    redirect: redirect,
  },
};

let routerFunc: any = null;
let routerPath = '';
const router = {
  get: (path: any, func: any) => {
    routerPath = path;
    routerFunc = func;
  },
  mockRouting: (path: string, req: any, res: any) => {
    if (path === routerPath) {
      if (routerFunc) {
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

test('Test redirect with endpoint empty', async () => {
  RedirectWithToken.registerEndpoint();
});


test('Test allowed redirect', async () => {
  let configureMethod = RedirectWithToken.registerEndpoint(listOfAllowedRedirects);
  configureMethod(router);

  let resultingRedirectURL = null;
  let resultingError = null;
  const exampleRes = {
    redirect: (redirectURL: string) => {
      resultingRedirectURL = redirectURL;
    },
    sendStatus: (code: number) => {
      resultingError = code;
    }
  };

  const expectingRedirectURL = redirect + refresh_token;

  router.mockRouting('/', exampleReq, exampleRes);
  expect(resultingError).toBeFalsy();
  expect(resultingRedirectURL).toBeTruthy();
  expect(resultingRedirectURL).toBe(expectingRedirectURL);
});
