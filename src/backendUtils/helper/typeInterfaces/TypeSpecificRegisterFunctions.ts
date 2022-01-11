/**
 * https://docs.directus.io/extensions/hooks/#register-function
 */
export default interface TypeSpecificRegisterFunctions {
  filter(event: string, func: any): any;
  action(event: string, func: any): any;
  init(): any;
  schedule(): any;
}
