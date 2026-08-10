declare module "bun:sqlite" {
  class Database {
    constructor(path: string, options?: { readonly?: boolean });
    prepare(sql: string): {
      all<T = Record<string, unknown>>(): T[];
      get<T = Record<string, unknown>>(): T | undefined;
      run(...params: unknown[]): void;
    };
    close(): void;
  }
}
