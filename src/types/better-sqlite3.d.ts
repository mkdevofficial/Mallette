declare module 'better-sqlite3' {
  export interface Statement {
    all(...params: any[]): any[];
    get(...params: any[]): any;
    run(...params: any[]): { changes: number; lastInsertRowid: number | bigint };
  }

  export interface Database {
    prepare(sql: string): Statement;
    pragma(pragma: string): any;
    close(): void;
  }

  export interface Options {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
    verbose?: (message?: any, ...additionalArgs: any[]) => void;
  }

  interface DatabaseConstructor {
    new (filename: string, options?: Options): Database;
    (filename: string, options?: Options): Database;
  }

  const Database: DatabaseConstructor;
  export default Database;
}
