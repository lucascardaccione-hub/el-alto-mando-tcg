/**
 * Regression tests for deck parsing / categorization.
 * Run with: npx tsx scripts/test_deck_parser.ts
 */
import { parsePtcglDeck, exportToPtcgl, isBasicEnergy, isKnownEnergyTrainer, isSpecialEnergy } from '../src/lib/deckParser';

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (cond) {
    console.log(`  ✔ ${msg}`);
  } else {
    failures++;
    console.error(`  ✘ ${msg}`);
  }
}

const deckText = `Pokémon: 17
2 Applin SCR 12
2 Meganium MEP 1
1 Fezandipiti ex ASC 288
2 Chikorita MEP 69
3 Teal Mask Ogerpon ex TWM 25
2 Hydrapple ex SCR 14
2 Bayleef MEG 9
2 Dipplin PRE 10
1 Meowth ex Perfect Order 062

Trainer: 29
2 Buddy-Buddy Poffin TWM 223
4 Lillie's Determination MEG 184
1 Bug Catching Set TWM 143
4 Forest of Vitality POR 109
1 Hero's Cape TEF 152
2 Dawn PFL 129
2 Bug Catching Set PRE 102
2 Night Stretcher SSP 251
2 Boss's Orders ASC 256
3 Ultra Ball BRS 186
2 Poké Pad POR 113
1 Xerosic's Machinations SFA 89
1 Poké Pad POR 81
1 Battle Cage PFL 116
1 Hilda WHT 171

Energy: 14
1 Energy Retrieval CRI 108
13 Basic Grass Energy MEE 1`;

console.log('\n[1] Parse user deck list');
const result = parsePtcglDeck(deckText);
assert(result.totalCards === 60, `total = 60 (got ${result.totalCards})`);
assert(result.pokemonCount === 17, `pokemon = 17 (got ${result.pokemonCount})`);
assert(result.trainerCount === 30, `trainer = 30 incl. Energy Retrieval (got ${result.trainerCount})`);
assert(result.energyCount === 13, `energy = 13 (got ${result.energyCount})`);
const er = result.cards.find((c) => c.name === 'Energy Retrieval');
assert(er?.category === 'trainer', `Energy Retrieval -> trainer (got ${er?.category})`);
const grass = result.cards.find((c) => c.name.includes('Grass Energy'));
assert(grass?.category === 'energy', `Basic Grass Energy -> energy (got ${grass?.category})`);

console.log('\n[2] Helper classification');
const trainerNames = ['Energy Retrieval', 'Energy Search', 'Energy Switch', 'Energy Recycler', 'Energy Loto', 'Earthen Vessel', 'Superior Energy Retrieval', 'Energy Search Pro'];
for (const n of trainerNames) {
  assert(isKnownEnergyTrainer(n) && !isBasicEnergy({ card_name: n }) && !isSpecialEnergy(n), `${n} is trainer`);
}
const specialNames = ['Double Turbo Energy', 'Jet Energy', 'Luminous Energy', 'Gift Energy', 'Mist Energy', 'Reversal Energy', 'Legacy Energy', 'Neo Upper Energy'];
for (const n of specialNames) {
  assert(isSpecialEnergy(n) && !isBasicEnergy({ card_name: n }) && !isKnownEnergyTrainer(n), `${n} is special energy`);
}
const basicNames = ['Basic Grass Energy', 'Basic {W} Energy', 'Fire Energy', 'Energía Planta Básica', 'Basic Darkness Energy'];
for (const n of basicNames) {
  assert(isBasicEnergy({ card_name: n }), `${n} is basic energy`);
}

console.log('\n[3] Export keeps Energy Retrieval under Trainer');
const exported = exportToPtcgl(
  result.cards.map((c) => ({ card_name: c.name, expansion: c.set, number: c.number, count: c.count, category: c.category }))
);
const energySection = exported.split('Energy:')[1] || '';
assert(!energySection.includes('Energy Retrieval'), 'Energy Retrieval not in Energy section');
assert(exported.includes('Trainer: 30'), 'Trainer header = 30');
assert(exported.includes('Energy: 13'), 'Energy header = 13');

console.log('\n[4] Round-trip parse(export(x)) is stable');
const reparsed = parsePtcglDeck(exported);
assert(reparsed.totalCards === 60 && reparsed.trainerCount === 30 && reparsed.energyCount === 13, 'round-trip counts stable');

console.log(failures === 0 ? '\nALL TESTS PASSED' : `\n${failures} TEST(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
