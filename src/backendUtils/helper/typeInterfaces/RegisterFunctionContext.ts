/**
 * https://docs.directus.io/extensions/hooks/#register-function
 */
export default interface RegisterFunctionContext {
  services(): any;
  exceptions(): any;
  database(): any;
  getSchema(): any;
  env(): any;
  logger(): any;
}
