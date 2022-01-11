/**
 * https://docs.directus.io/extensions/hooks/#register-function
 */
export default interface TypeSpecificRegisterFunctions {
  filter(event: string, func: any): any;
  action(): any;
  init(): any;
  schedule(): any;
}
