const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'data', 'altomando.db'));
const cols = db.pragma('table_info(cards)');
if (!cols.some(c => c.name === 'language')) {
  db.exec("ALTER TABLE cards ADD COLUMN language TEXT NOT NULL DEFAULT 'Inglés'");
  db.exec("CREATE INDEX IF NOT EXISTS idx_cards_language ON cards(language)");
  console.log('✅ Columna language agregada exitosamente a la tabla cards.');
} else {
  console.log('ℹ️ La columna language ya existe.');
}
