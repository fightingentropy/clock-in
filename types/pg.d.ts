declare module "pg" {
  import { EventEmitter } from "node:events";

  export interface PoolConfig {
    connectionString?: string;
    ssl?:
      | boolean
      | {
          ca?: string;
          key?: string;
          cert?: string;
          rejectUnauthorized?: boolean;
        };
    [key: string]: unknown;
  }

  export interface QueryResultRow {
    [column: string]: unknown;
  }

  export interface QueryField {
    name: string;
    tableID: number;
    columnID: number;
    dataTypeID: number;
    dataTypeSize: number;
    dataTypeModifier: number;
    format: "text" | "binary";
  }

  export type QueryCommand =
    | "SELECT"
    | "INSERT"
    | "UPDATE"
    | "DELETE"
    | "MERGE";

  export interface QueryResult<R extends QueryResultRow = QueryResultRow> {
    rows: R[];
    rowCount: number;
    command: QueryCommand;
    oid: number;
    fields: QueryField[];
  }

  export interface QueryConfig {
    text: string;
    values?: ReadonlyArray<unknown>;
    rowMode?: "array";
    types?: unknown;
  }

  export interface Cursor<R extends QueryResultRow = QueryResultRow> {
    read(rows: number): Promise<R[]>;
    close(): Promise<void>;
  }

  export interface PoolClient extends EventEmitter {
    query<R extends QueryResultRow = QueryResultRow>(
      sql: string,
      parameters?: ReadonlyArray<unknown>,
    ): Promise<QueryResult<R>>;
    query<R extends QueryResultRow = QueryResultRow>(
      config: QueryConfig,
    ): Promise<QueryResult<R>>;
    query<R extends QueryResultRow = QueryResultRow>(
      cursor: Cursor<R>,
    ): Cursor<R>;
    release(err?: Error): void;
  }

  export class Pool extends EventEmitter {
    constructor(config?: PoolConfig);
    connect(): Promise<PoolClient>;
    query<R extends QueryResultRow = QueryResultRow>(
      sql: string,
      parameters?: ReadonlyArray<unknown>,
    ): Promise<QueryResult<R>>;
    query<R extends QueryResultRow = QueryResultRow>(
      config: QueryConfig,
    ): Promise<QueryResult<R>>;
    end(): Promise<void>;
  }
}
