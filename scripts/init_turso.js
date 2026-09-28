const { createClient } = require('@libsql/client');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

async function main() {
  const url = env.TURSO_DATABASE_URL;
  const authToken = env.TURSO_AUTH_TOKEN;

  console.log('Connecting to Turso at:', url);
  const client = createClient({ url, authToken });

  // Test query
  const testRes = await client.execute('SELECT 1 as test');
  console.log('Test query success:', testRes.rows);

  // Create tables
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      is_active INTEGER NOT NULL DEFAULT 1,
      is_verified INTEGER NOT NULL DEFAULT 0,
      verification_token TEXT,
      verification_code TEXT,
      verification_expires TEXT,
      created_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS decks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'Standard',
      description TEXT,
      is_public INTEGER NOT NULL DEFAULT 1,
      cover_card_image TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS deck_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      deck_id INTEGER NOT NULL,
      card_name TEXT NOT NULL,
      expansion TEXT NOT NULL,
      number TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'pokemon',
      trainer_type TEXT DEFAULT '',
      count INTEGER NOT NULL DEFAULT 1,
      owned_count INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      tcg_id TEXT
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      expansion TEXT NOT NULL,
      number TEXT NOT NULL,
      version TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'Inglés',
      artist TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 1,
      image_url TEXT NOT NULL,
      tcg_id TEXT,
      rarity TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Seed default admins
  const defaultAdmins = [
    {
      username: 'Luca',
      email: 'luca.scardaccione@gmail.com',
      hash: '$2b$10$dNjH5uEyHFcAOmIyIopIMO5iYV4NUUySxHeVXhZE/hBuAIRsVXeO2',
      role: 'admin',
    },
    {
      username: 'Nahue',
      email: 'nahueds@gmail.com',
      hash: '$2b$10$ka/pK4FSo1KxenM7Boz.JuclgzSElI/CSHraOhgmJ3oG2YFBcFpgm',
      role: 'admin',
    },
    {
      username: 'Mateo',
      email: 'lopezmateo2406@gmail.com',
      hash: '$2b$10$vHQf5dZyGOLKH88E.R7WiuNM4NWfy9tfPc5KLOVSCHI/o0ZdWyFEm',
      role: 'admin',
    },
    {
      username: 'Ro',
      email: 'rociovmanrique07@gmail.com',
      hash: '$2b$10$ZDy32Ro8O.RAoZoudpNpb.IaBJN6P8IVXcRH8Ka0hJPqv0szgLIDe',
      role: 'admin',
    },
  ];

  const now = new Date().toISOString();
  for (const a of defaultAdmins) {
    const existing = await client.execute({
      sql: 'SELECT id FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE',
      args: [a.username, a.email],
    });
    if (existing.rows.length === 0) {
      await client.execute({
        sql: `INSERT INTO users (username, email, password_hash, role, is_active, is_verified, created_at)
              VALUES (?, ?, ?, ?, 1, 1, ?)`,
        args: [a.username, a.email, a.hash, a.role, now],
      });
      console.log('Admin inserted:', a.username);
    } else {
      console.log('Admin already exists:', a.username);
    }
  }

  const allUsers = await client.execute('SELECT id, username, email, role FROM users');
  console.log('Users in Turso:', allUsers.rows);
  console.log('TURSO DATABASE INITIALIZED SUCCESSFULLY!');
}

main().catch(console.error);
