import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Store the SQLite database file in a data directory
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'altomando.db');

// Global cache for development hot reloading
declare global {
  var _sqliteDb: Database.Database | undefined;
}

function getDatabase(): Database.Database {
  if (process.env.NODE_ENV === 'development' && global._sqliteDb) {
    return global._sqliteDb;
  }

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Initialize tables
  db.exec(`
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

    CREATE INDEX IF NOT EXISTS idx_cards_expansion ON cards(expansion);
    CREATE INDEX IF NOT EXISTS idx_cards_artist ON cards(artist);
    CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name);
    CREATE INDEX IF NOT EXISTS idx_cards_language ON cards(language);
    CREATE INDEX IF NOT EXISTS idx_decks_user ON decks(user_id);
    CREATE INDEX IF NOT EXISTS idx_deck_cards_deck ON deck_cards(deck_id);
    CREATE INDEX IF NOT EXISTS idx_deck_cards_name ON deck_cards(card_name);
  `);

  // Safe migrations for existing DB
  try {
    const userCols = db.pragma('table_info(users)') as { name: string }[];
    if (!userCols.some((c) => c.name === 'email')) {
      db.exec("ALTER TABLE users ADD COLUMN email TEXT");
      db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)");
    }
    if (!userCols.some((c) => c.name === 'is_verified')) {
      db.exec("ALTER TABLE users ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 0");
    }
    if (!userCols.some((c) => c.name === 'verification_token')) {
      db.exec("ALTER TABLE users ADD COLUMN verification_token TEXT");
    }
    if (!userCols.some((c) => c.name === 'verification_code')) {
      db.exec("ALTER TABLE users ADD COLUMN verification_code TEXT");
    }
    if (!userCols.some((c) => c.name === 'verification_expires')) {
      db.exec("ALTER TABLE users ADD COLUMN verification_expires TEXT");
    }

    // Ensure default admin user is verified
    db.exec("UPDATE users SET is_verified = 1, email = 'admin@elaltomandotcg.com' WHERE username = 'admin' AND (email IS NULL OR is_verified = 0)");

    // Ensure initial admin accounts exist with secure bcrypt hashes
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

    const insertAdminStmt = db.prepare(`
      INSERT OR IGNORE INTO users (username, email, password_hash, role, is_active, is_verified, created_at)
      VALUES (?, ?, ?, ?, 1, 1, ?)
    `);

    const now = new Date().toISOString();
    for (const a of defaultAdmins) {
      const existing = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE').get(a.username, a.email);
      if (!existing) {
        insertAdminStmt.run(a.username, a.email, a.hash, a.role, now);
      }
    }

    const cardCols = db.pragma('table_info(cards)') as { name: string }[];
    if (!cardCols.some((c) => c.name === 'language')) {
      db.exec("ALTER TABLE cards ADD COLUMN language TEXT NOT NULL DEFAULT 'Inglés'");
    }
  } catch (e) {
    console.error('Migration notice:', e);
  }

  if (process.env.NODE_ENV === 'development') {
    global._sqliteDb = db;
  }

  return db;
}

let _dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_dbInstance) {
    _dbInstance = getDatabase();
  }
  return _dbInstance;
}

export const db: Database.Database = new Proxy({} as Database.Database, {
  get(target, prop, receiver) {
    const realDb = getDb();
    const value = Reflect.get(realDb, prop, receiver);
    return typeof value === 'function' ? value.bind(realDb) : value;
  },
  set(target, prop, value, receiver) {
    const realDb = getDb();
    return Reflect.set(realDb, prop, value, receiver);
  },
});

export default db;

