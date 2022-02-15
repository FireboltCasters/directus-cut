import DBImplementation from './DBImplementation';
import {Directus} from '@directus/sdk';

export default class DBFrontend implements DBImplementation {
  private database: Directus<any>;

  constructor(database: Directus<any>) {
    this.database = database;
  }

  async createOne(collection: string, data: any): Promise<any> {
    return await this.database.items(collection).createOne(data);
  }

  async readOne(collection: string, primaryKey: number | string): Promise<any> {
    return await this.database.items(collection).readOne(primaryKey);
  }

  async readMany(
    collection: string,
    query?: {offset?: any; limit?: any; meta?: any; filter?: any}
  ): Promise<any> {
    return await this.database.items(collection).readMany(query);
  }

  async updateOne(
    collection: string,
    primaryKey: number | string,
    data: any
  ): Promise<any> {
    return await this.database.items(collection).updateOne(primaryKey, data);
  }

  async deleteOne(
    collection: string,
    primaryKey: number | string
  ): Promise<boolean> {
    await this.database.items(collection).deleteOne(primaryKey);
    return true;
  }

  async getCurrentUserRole(): Promise<string> {
    let me = await this.database.users.me.read();
    let role = await this.getRole(me);
    return role.id;
  }

  async isCurrentUserAdmin(): Promise<boolean> {
    let me = await this.database.users.me.read();
    let role = await this.getRole(me);
    return role.admin_access;
  }

  private async getRole(user: any): Promise<any> {
    let role_id = user?.role;
    if (!!role_id) {
      return await this.database.roles.readOne(role_id);
    }
    return null;
  }
}
