import { createClient, Client } from '@libsql/client';

let _client: Client | null = null;

export function getClient(): Client {
  if (_client) return _client;

  const url = process.env.TURSO_DATABASE_URL || 'file:data/altomando.db';
  const authToken = process.env.TURSO_AUTH_TOKEN;

  _client = createClient({
    url,
    authToken,
  });

  return _client;
}

export const db = {
  async get<T = any>(sql: string, args: any[] = []): Promise<T | undefined> {
    const client = getClient();
    const result = await client.execute({ sql, args });
    return (result.rows[0] as unknown as T) || undefined;
  },

  async all<T = any>(sql: string, args: any[] = []): Promise<T[]> {
    const client = getClient();
    const result = await client.execute({ sql, args });
    return result.rows as unknown as T[];
  },

  async run(sql: string, args: any[] = []): Promise<{ lastInsertRowid: number; rowsAffected: number }> {
    const client = getClient();
    const result = await client.execute({ sql, args });
    return {
      lastInsertRowid: Number(result.lastInsertRowid || 0),
      rowsAffected: result.rowsAffected,
    };
  },

  async exec(sql: string): Promise<void> {
    const client = getClient();
    await client.executeMultiple(sql);
  },

  async batch(statements: Array<{ sql: string; args?: any[] }>): Promise<any[]> {
    const client = getClient();
    return await client.batch(statements, 'write');
  },
};

export default db;


