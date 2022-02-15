

export default interface DBImplementation {

    createOne(collection: string, data: any): Promise<any>;

    readOne(collection: string, primaryKey: number | string): Promise<any>;

    readMany(collection: string, query?: { offset?: any, limit?: any, meta?: any, filter?: any }): Promise<any>;

    updateOne(collection: string, primaryKey: number | string, data: any): Promise<any>;

    deleteOne(collection: string, primaryKey: number | string): Promise<boolean>;

    getCurrentUserRole(): Promise<string>;

    isCurrentUserAdmin(): Promise<boolean>;
}
