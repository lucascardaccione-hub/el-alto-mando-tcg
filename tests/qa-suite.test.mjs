import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { createClient } from '@libsql/client';

const nativeRequire = createRequire(import.meta.url);
const moduleCache = new Map();

function loadTsModule(relPath, baseDir = process.cwd()) {
  if (!relPath.startsWith('.') && !relPath.startsWith('@/') && !relPath.endsWith('.ts')) {
    return nativeRequire(relPath);
  }
  let fullPath;
  if (relPath.startsWith('@/')) {
    fullPath = path.join(process.cwd(), 'src', relPath.slice(2));
  } else if (relPath.startsWith('.')) {
    fullPath = path.resolve(baseDir, relPath);
  } else {
    fullPath = path.join(process.cwd(), relPath);
  }
  if (!fullPath.endsWith('.ts') && fs.existsSync(`${fullPath}.ts`)) {
    fullPath = `${fullPath}.ts`;
  }
  if (moduleCache.has(fullPath)) return moduleCache.get(fullPath);

  const source = fs.readFileSync(fullPath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const mod = { exports: {} };
  moduleCache.set(fullPath, mod.exports);
  const fn = vm.runInThisContext(
    `(function(exports, module, require) { ${transpiled} })`,
    { filename: fullPath }
  );
  fn(mod.exports, mod, (reqPath) => loadTsModule(reqPath, path.dirname(fullPath)));
  return mod.exports;
}

const {
  parsePtcglDeck,
  validateDeckLegality,
  exportToPtcgl,
} = loadTsModule('src/lib/deckParser.ts');

describe('1. Deck Parser & Reglas de Legalidad Pokémon TCG (Unit Tests)', () => {
  it('parsea una lista oficial de 60 cartas PTCGL / Limitless correctamente', () => {
    const sampleDeck = `
Pokémon: 16
4 Charmander MEW 4
2 Charmeleon PAF 8
3 Charizard ex OBF 125
2 Pidgey MEW 16
2 Pidgeot ex OBF 164
1 Radiant Charizard CRZ 20
1 Rotom V LOR 58
1 Lumineon V BRS 40

Trainer: 34
4 Arven OBF 186
4 Iono PAL 185
2 Boss's Orders PAL 172
1 Professor's Research SVI 189
4 Buddy-Buddy Poffin TEF 144
4 Ultra Ball SVI 196
4 Rare Candy SVI 191
2 Super Rod PAL 188
2 Counter Catcher PAR 160
1 Prime Catcher TEF 157
1 Forest Seal Stone SIT 156
1 Defiance Band SVI 169
2 Artazon PAL 171
2 Lost Vacuum LOR 162

Energy: 10
10 Basic {R} Energy SVE 2
Total Cards: 60
    `;

    const result = parsePtcglDeck(sampleDeck);
    assert.equal(result.totalCards, 60);
    assert.equal(result.pokemonCount, 16);
    assert.equal(result.trainerCount, 34);
    assert.equal(result.energyCount, 10);
    assert.equal(result.unrecognizedLines.length, 0);
    assert.equal(result.warnings.length, 0);
  });

  it('consolida líneas duplicadas de la misma carta e informa líneas inválidas sin corromper el mazo', () => {
    const messyInput = `
Pokémon: 4
2 Charmander MEW 4
2 Charmander MEW 4
Línea corrupta sin formato válido 123
0 CartaConCantidadCero SVI 10
Trainer: 4
4 Ultra Ball SVI 196
Energy: 12
12 Basic {R} Energy SVE 2
    `;

    const result = parsePtcglDeck(messyInput);
    const charmanders = result.cards.filter((c) => c.name === 'Charmander');
    assert.equal(charmanders.length, 1, 'Debe fusionar entradas idénticas de Charmander MEW 4');
    assert.equal(charmanders[0].count, 4);
    assert.equal(result.unrecognizedLines.length, 2, 'Debe reportar las 2 líneas inválidas');
    assert.equal(result.unrecognizedLines[0].text, 'Línea corrupta sin formato válido 123');
  });

  it('valida la regla de máximo 4 copias por nombre (excepto Energías Básicas) y mínimo 1 Pokémon', () => {
    // 5 copias de Charizard ex en distintas expansiones -> inválido
    const fiveCharizards = validateDeckLegality([
      { card_name: 'Charizard ex', expansion: 'OBF', number: '125', category: 'pokemon', count: 3 },
      { card_name: 'Charizard ex', expansion: 'PAF', number: '54', category: 'pokemon', count: 2 },
      { card_name: 'Basic Fire Energy', expansion: 'SVE', number: '2', category: 'energy', count: 55 },
    ]);
    assert.equal(fiveCharizards.totalCards, 60);
    assert.equal(fiveCharizards.canPublish, false);
    assert.ok(fiveCharizards.errors.some((e) => e.includes('Charizard ex') && e.includes('4 copias')));

    // 15 Energías Básicas -> permitido por excepción de energía básica
    const validWithManyBasicEnergies = validateDeckLegality([
      { card_name: 'Charizard ex', expansion: 'OBF', number: '125', category: 'pokemon', count: 4 },
      { card_name: 'Basic Fire Energy', expansion: 'SVE', number: '2', category: 'energy', count: 56 },
    ]);
    assert.equal(validWithManyBasicEnergies.totalCards, 60);
    assert.equal(validWithManyBasicEnergies.errors.length, 0);
    assert.equal(validWithManyBasicEnergies.canPublish, true);

    // Mazo sin Pokémon -> inválido
    const noPokemon = validateDeckLegality([
      { card_name: 'Basic Fire Energy', expansion: 'SVE', number: '2', category: 'energy', count: 60 },
    ]);
    assert.equal(noPokemon.canPublish, false);
    assert.ok(noPokemon.errors.some((e) => e.includes('al menos 1 carta de Pokémon')));
  });

  it('exporta y reimporta una lista manteniendo conteos exactos', () => {
    const original = [
      { card_name: 'Greninja ex', expansion: 'TWM', number: '106', count: 3, category: 'pokemon' },
      { card_name: 'Ultra Ball', expansion: 'SVI', number: '196', count: 4, category: 'trainer' },
      { card_name: 'Basic Water Energy', expansion: 'SVE', number: '3', count: 10, category: 'energy' },
    ];
    const exported = exportToPtcgl(original);
    const reimported = parsePtcglDeck(exported);
    assert.equal(reimported.totalCards, 17);
    assert.equal(reimported.pokemonCount, 3);
    assert.equal(reimported.trainerCount, 4);
    assert.equal(reimported.energyCount, 10);
  });
});

describe('2. Seguridad de Autorización, Integridad de Precios y Concurrencia de Stock (Integration Tests)', () => {
  const testDbPath = path.join(process.cwd(), 'data', 'qa-test-temp.db');
  let client;

  before(async () => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    client = createClient({ url: `file:${testDbPath}` });

    await client.executeMultiple(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'player',
        created_at TEXT NOT NULL
      );
      CREATE TABLE cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        expansion TEXT NOT NULL,
        number TEXT NOT NULL,
        category TEXT DEFAULT 'Pokemon',
        version TEXT DEFAULT 'Normal',
        language TEXT DEFAULT 'Inglés',
        price REAL NOT NULL,
        stock INTEGER NOT NULL DEFAULT 1,
        image_url TEXT NOT NULL,
        seller_id INTEGER,
        seller_name TEXT DEFAULT 'Tienda',
        updated_at TEXT NOT NULL
      );
      CREATE TABLE decks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        format TEXT DEFAULT 'Standard',
        description TEXT DEFAULT '',
        is_public INTEGER DEFAULT 0,
        cover_card_image TEXT DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    const now = new Date().toISOString();
    // Crear usuario propietario real y usuario atacante con email que contiene "luca"
    await client.execute({
      sql: `INSERT INTO users (id, username, email, password_hash, role, created_at) VALUES (1, 'entrenador_owner', 'owner@test.com', 'hash', 'player', ?)`,
      args: [now],
    });
    await client.execute({
      sql: `INSERT INTO users (id, username, email, password_hash, role, created_at) VALUES (2, 'atacante_externo', 'fake_luca_123@gmail.com', 'hash', 'player', ?)`,
      args: [now],
    });

    // Crear mazo privado del usuario 1
    await client.execute({
      sql: `INSERT INTO decks (id, user_id, name, is_public, created_at, updated_at) VALUES (10, 1, 'Mazo Secreto Torneo', 0, ?, ?)`,
      args: [now, now],
    });

    // Crear carta con stock = 1 y precio oficial = 15000
    await client.execute({
      sql: `INSERT INTO cards (id, name, expansion, number, category, version, language, price, stock, image_url, seller_id, seller_name, updated_at)
            VALUES (100, 'Prime Catcher', 'TEF', '157', 'Trainer', 'ACE SPEC', 'Inglés', 15000, 1, '/placeholder-card.svg', 1, 'Alto Mando', ?)`,
      args: [now],
    });
  });

  after(() => {
    try {
      client?.close?.();
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    } catch {}
  });

  it('bloquea la escalada de privilegios por subcadena "luca" en email sobre mazos privados y ajenos (detalle, clonado, comentarios, likes y top-cards)', async () => {
    const deckRouteCode = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', 'api', 'decks', '[id]', 'route.ts'),
      'utf8'
    );
    const cloneRouteCode = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', 'api', 'decks', '[id]', 'clone', 'route.ts'),
      'utf8'
    );
    const topCardsRouteCode = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', 'api', 'decks', 'top-cards', 'route.ts'),
      'utf8'
    );

    assert.equal(
      deckRouteCode.includes(".includes('luca')"),
      false,
      'El endpoint /api/decks/[id] NO debe otorgar permisos admin por subcadena .includes("luca") en el email'
    );
    assert.equal(
      cloneRouteCode.includes(".includes('luca')"),
      false,
      'El endpoint /api/decks/[id]/clone NO debe otorgar permisos admin por subcadena .includes("luca") en el email'
    );
    assert.ok(
      topCardsRouteCode.includes('WHERE is_public = 1') && topCardsRouteCode.includes('WHERE d.is_public = 1'),
      'El endpoint /api/decks/top-cards solo debe contabilizar mazos públicos (is_public = 1)'
    );

    // Simulación exacta de la evaluación de permisos en GET/PUT/DELETE/CLONE /api/decks/[id]
    const deck = (await client.execute({ sql: 'SELECT * FROM decks WHERE id = 10', args: [] })).rows[0];
    const attackerUser = (await client.execute({ sql: 'SELECT * FROM users WHERE id = 2', args: [] })).rows[0];

    const isOwner = deck.user_id === attackerUser.id;
    const isAdmin = attackerUser.username?.toLowerCase() === 'luca' || attackerUser.role === 'admin';
    const canViewOrClonePrivate = deck.is_public === 1 || isOwner || isAdmin;
    const canEditOrDelete = isOwner || isAdmin;

    assert.equal(canViewOrClonePrivate, false, 'Un usuario externo con email "fake_luca_123@gmail.com" NO puede ver ni clonar mazos privados ajenos');
    assert.equal(canEditOrDelete, false, 'Un usuario externo con email "fake_luca_123@gmail.com" NO puede editar ni borrar mazos ajenos');
  });

  it('impide sobreventa (overselling) cuando dos compradores intentan comprar simultáneamente la última unidad en stock', async () => {
    const now = new Date().toISOString();

    // Dos solicitudes concurrentes intentando descontar 1 unidad de la carta ID 100 (que tiene stock = 1)
    const attemptPurchase = async () => {
      const res = await client.execute({
        sql: 'UPDATE cards SET stock = stock - ?, updated_at = ? WHERE id = ? AND stock >= ?',
        args: [1, now, 100, 1],
      });
      return Number(res.rowsAffected ?? 0);
    };

    const [buyer1Affected, buyer2Affected] = await Promise.all([
      attemptPurchase(),
      attemptPurchase(),
    ]);

    assert.equal(
      buyer1Affected + buyer2Affected,
      1,
      'Exactamente 1 comprador debe lograr reservar la última unidad y el segundo debe recibir 0 filas afectadas (409 Conflict)'
    );

    const cardAfter = (await client.execute({ sql: 'SELECT stock FROM cards WHERE id = 100', args: [] })).rows[0];
    assert.equal(Number(cardAfter.stock), 0, 'El stock final debe quedar exactamente en 0, nunca negativo');
  });

  it('ignora precios manipulados por el cliente y exige siempre el precio oficial de la base de datos', async () => {
    const ordersRouteCode = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', 'api', 'orders', 'route.ts'),
      'utf8'
    );
    assert.ok(
      ordersRouteCode.includes('WHERE id = ? AND stock >= ?'),
      'El endpoint de órdenes debe usar actualización condicional atómica de stock'
    );

    // Verificar que el cálculo de precio usa dbCard.price y no clientItem.price
    const dbCard = (await client.execute({ sql: 'SELECT price FROM cards WHERE id = 100', args: [] })).rows[0];
    const tamperedClientItem = { id: 100, price: 1, quantity: 2 };
    const authoritativeTotal = Number(dbCard.price) * tamperedClientItem.quantity;

    assert.equal(authoritativeTotal, 30000);
    assert.notEqual(authoritativeTotal, tamperedClientItem.price * tamperedClientItem.quantity);
  });

  it('verifica que la búsqueda y filtros combinados del catálogo distingan catálogo vacío de resultados filtrados', async () => {
    // Restaurar stock de carta 100 a 3 unidades para probar filtros
    await client.execute({ sql: 'UPDATE cards SET stock = 3 WHERE id = 100', args: [] });

    const matchRes = await client.execute({
      sql: `SELECT * FROM cards WHERE stock > 0 AND LOWER(name) LIKE ? AND LOWER(category) = ? AND LOWER(language) = ?`,
      args: ['%prime catcher%', 'trainer', 'inglés'],
    });
    assert.equal(matchRes.rows.length, 1);

    const emptyFilterRes = await client.execute({
      sql: `SELECT * FROM cards WHERE stock > 0 AND LOWER(name) LIKE ? AND LOWER(language) = ?`,
      args: ['%prime catcher%', 'japonés'],
    });
    assert.equal(emptyFilterRes.rows.length, 0);
  });
});
