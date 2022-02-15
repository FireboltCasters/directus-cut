import DBImplementation from "./DBImplementation";


export default class DBBackend implements DBImplementation {

    private database: any;

    constructor(database: any) {
        this.database = database;
    }

    async createOne(collection: string, data: any): Promise<any> {
        return await this.database(collection).insert(data).returning("*");
    }

    async deleteOne(collection: string, primaryKey: number | string): Promise<boolean> {
        await this.database(collection).where({id: primaryKey}).del();
        return true;
    }

    async getCurrentUserRole(): Promise<string> {
        return Promise.resolve("");
    }

    async isCurrentUserAdmin(): Promise<boolean> {
        return Promise.resolve(false);
    }

    async readMany(collection: string, query?: { offset?: any; limit?: any; meta?: any; filter?: any }): Promise<any> {
        // TODO: Transform query into knex syntax (https://knexjs.org/#Builder-where)
        //return await this.database(collection).where({id: primaryKey});
        return Promise.resolve(undefined);
    }

    async readOne(collection: string, primaryKey: number | string): Promise<any> {
        return await this.database(collection).where({id: primaryKey}).first();
    }

    async updateOne(collection: string, primaryKey: number | string, data: any): Promise<any> {
        return await this.database(collection).where({id: primaryKey}).update(data).returning("*");
    }
}
