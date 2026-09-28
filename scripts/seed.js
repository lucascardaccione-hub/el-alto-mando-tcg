const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'altomando.db');
const db = new Database(DB_PATH);

console.log('Inicializando base de datos en:', DB_PATH);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    expansion TEXT NOT NULL,
    number TEXT NOT NULL,
    version TEXT NOT NULL,
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
`);

// 1. Create or ensure default admin user
const adminCheck = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
const now = new Date().toISOString();

if (!adminCheck) {
  const hash = bcrypt.hashSync('altomando2024', 10);
  db.prepare(`
    INSERT INTO users (username, password_hash, role, is_active, created_at)
    VALUES (?, ?, 'owner', 1, ?)
  `).run('admin', hash, now);
  console.log('✅ Usuario Administrador Creado:');
  console.log('   Usuario: admin');
  console.log('   Contraseña: altomando2024');
} else {
  console.log('ℹ️ Usuario admin ya existe.');
}

// 2. Sample high-quality cards for El Alto Mando TCG catalog
const cardsCount = db.prepare('SELECT COUNT(*) as count FROM cards').get().count;

if (cardsCount === 0) {
  console.log('Sembrando catálogo inicial de cartas...');

  const sampleCards = [
    {
      name: 'Charizard ex',
      expansion: '151',
      number: '199/165',
      version: 'Special Illustration Rare',
      artist: 'AKIRA EGAWA',
      price: 135000,
      stock: 2,
      image_url: 'https://assets.tcgdex.net/en/sv/sv03.5/199/high.webp',
      rarity: 'Special Illustration Rare',
      notes: 'Near Mint - Impecable centrado'
    },
    {
      name: 'Pikachu',
      expansion: '151',
      number: '173/165',
      version: 'Illustration Rare',
      artist: 'Hiroyuki Yamamoto',
      price: 45000,
      stock: 4,
      image_url: 'https://assets.tcgdex.net/en/sv/sv03.5/173/high.webp',
      rarity: 'Illustration Rare',
      notes: 'Pack Fresh'
    },
    {
      name: 'Mew ex',
      expansion: '151',
      number: '205/165',
      version: 'Hyper Rare / Gold',
      artist: 'PLANETA Mochizuki',
      price: 68000,
      stock: 1,
      image_url: 'https://assets.tcgdex.net/en/sv/sv03.5/205/high.webp',
      rarity: 'Hyper Rare',
      notes: 'Carta Dorada Ultra Rare'
    },
    {
      name: 'Gengar',
      expansion: '151',
      number: '094/165',
      version: 'Holo',
      artist: 'Tomokazu Komiya',
      price: 9500,
      stock: 6,
      image_url: 'https://assets.tcgdex.net/en/sv/sv03.5/094/high.webp',
      rarity: 'Rare Holo',
      notes: 'Arte icónico de Komiya'
    },
    {
      name: 'Gengar',
      expansion: '151',
      number: '094/165',
      version: 'Reverse Holo',
      artist: 'Tomokazu Komiya',
      price: 11000,
      stock: 3,
      image_url: 'https://assets.tcgdex.net/en/sv/sv03.5/094/high.webp',
      rarity: 'Reverse Holo',
      notes: 'Foil Pokéball Pattern'
    },
    {
      name: 'Iono / e-Nigma',
      expansion: 'Paldea Evolved',
      number: '269/193',
      version: 'Special Illustration Rare',
      artist: 'kirisAki',
      price: 98000,
      stock: 2,
      image_url: 'https://assets.tcgdex.net/en/sv/sv02/269/high.webp',
      rarity: 'Special Illustration Rare',
      notes: 'Waifu / Trainer SAR'
    },
    {
      name: 'Gardevoir ex',
      expansion: 'Scarlet & Violet',
      number: '245/198',
      version: 'Special Illustration Rare',
      artist: 'Jiro Sasumo',
      price: 54000,
      stock: 3,
      image_url: 'https://assets.tcgdex.net/en/sv/sv01/245/high.webp',
      rarity: 'Special Illustration Rare',
      notes: 'Línea evolutiva emotiva'
    },
    {
      name: 'Umbreon VMAX',
      expansion: 'Evolving Skies',
      number: '215/203',
      version: 'Alternate Art / Moonbreon',
      artist: 'KEIICHIRO ITO',
      price: 750000,
      stock: 1,
      image_url: 'https://assets.tcgdex.net/en/swsh/swsh7/215/high.webp',
      rarity: 'Secret Rare',
      notes: 'Joyas del TCG - Moonbreon NM'
    },
    {
      name: 'Giratina V',
      expansion: 'Lost Origin',
      number: '186/196',
      version: 'Alternate Art',
      artist: 'Shinji Kanda',
      price: 320000,
      stock: 1,
      image_url: 'https://assets.tcgdex.net/en/swsh/swsh11/186/high.webp',
      rarity: 'Ultra Rare',
      notes: 'Obra de arte de Shinji Kanda'
    },
    {
      name: 'Charmander',
      expansion: '151',
      number: '168/165',
      version: 'Illustration Rare',
      artist: 'Mitsuhiro Arita',
      price: 42000,
      stock: 5,
      image_url: 'https://assets.tcgdex.net/en/sv/sv03.5/168/high.webp',
      rarity: 'Illustration Rare',
      notes: 'Ilustrado por Mitsuhiro Arita'
    },
    {
      name: 'Rayquaza VMAX',
      expansion: 'Crown Zenith',
      number: '101/159',
      version: 'Secret Rare',
      artist: 'PLANETA Igarashi',
      price: 28000,
      stock: 3,
      image_url: 'https://assets.tcgdex.net/en/swsh/swsh12.5/101/high.webp',
      rarity: 'Secret Rare',
      notes: 'Near Mint'
    },
    {
      name: 'Squirtle',
      expansion: '151',
      number: '170/165',
      version: 'Illustration Rare',
      artist: 'Mitsuhiro Arita',
      price: 38000,
      stock: 4,
      image_url: 'https://assets.tcgdex.net/en/sv/sv03.5/170/high.webp',
      rarity: 'Illustration Rare',
      notes: 'En la orilla de la playa'
    }
  ];

  const insertStmt = db.prepare(`
    INSERT INTO cards (
      name, expansion, number, version, artist, price, stock, image_url, rarity, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of sampleCards) {
    insertStmt.run(
      c.name,
      c.expansion,
      c.number,
      c.version,
      c.artist,
      c.price,
      c.stock,
      c.image_url,
      c.rarity,
      c.notes,
      now,
      now
    );
  }

  console.log(`✅ ${sampleCards.length} cartas sembradas con éxito en el catálogo.`);
} else {
  console.log(`ℹ️ La base de datos ya contiene ${cardsCount} cartas.`);
}

console.log('Base de datos lista.');
