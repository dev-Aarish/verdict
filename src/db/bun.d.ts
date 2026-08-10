declare module "bun:sqlite" {
  class Database {
    constructor(path: string, options?: { readonly?: boolean });
    prepare(sql: string): {
      all<T = any>(): T[];
      get<T = any>(): T | undefined;
      run(...params: any[]): void;
    };
    close(): void;
  }
}
