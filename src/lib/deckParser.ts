export interface ParsedDeckCard {
  count: number;
  name: string;
  set: string;
  number: string;
  category: 'pokemon' | 'trainer' | 'energy';
  trainerType?: string;
  image?: string;
}

export interface ParsedDeck {
  cards: ParsedDeckCard[];
  totalCards: number;
  pokemonCount: number;
  trainerCount: number;
  energyCount: number;
}

export const PTCGL_SET_MAP: Record<string, { id: string; serie: string; name: string }> = {
  // Scarlet & Violet
  'SVI': { id: 'sv01', serie: 'sv', name: 'Scarlet & Violet' },
  'SVE': { id: 'sve', serie: 'sv', name: 'Scarlet & Violet Energy' },
  'MEE': { id: 'sve', serie: 'sv', name: 'Scarlet & Violet Energy' },
  'SVP': { id: 'svp', serie: 'sv', name: 'SVP Black Star Promos' },
  'PR-SV': { id: 'svp', serie: 'sv', name: 'SVP Black Star Promos' },
  'PAL': { id: 'sv02', serie: 'sv', name: 'Paldea Evolved' },
  'OBF': { id: 'sv03', serie: 'sv', name: 'Obsidian Flames' },
  'MEW': { id: 'sv03.5', serie: 'sv', name: '151' },
  'PAR': { id: 'sv04', serie: 'sv', name: 'Paradox Rift' },
  'PAF': { id: 'sv04.5', serie: 'sv', name: 'Paldean Fates' },
  'TEF': { id: 'sv05', serie: 'sv', name: 'Temporal Forces' },
  'TWM': { id: 'sv06', serie: 'sv', name: 'Twilight Masquerade' },
  'SFA': { id: 'sv06.5', serie: 'sv', name: 'Shrouded Fable' },
  'SCR': { id: 'sv07', serie: 'sv', name: 'Stellar Crown' },
  'SSP': { id: 'sv08', serie: 'sv', name: 'Surging Sparks' },
  'PRE': { id: 'sv08.5', serie: 'sv', name: 'Prismatic Evolutions' },
  'JTG': { id: 'sv09', serie: 'sv', name: 'Journey Together' },
  'DTR': { id: 'sv10', serie: 'sv', name: 'Destined Rivals' },
  'WHT': { id: 'sv10.5w', serie: 'sv', name: 'White Flare' },
  'BLK': { id: 'sv10.5b', serie: 'sv', name: 'Black Bolt' },

  // Sword & Shield
  'SSH': { id: 'swsh1', serie: 'swsh', name: 'Sword & Shield' },
  'RCL': { id: 'swsh2', serie: 'swsh', name: 'Rebel Clash' },
  'DAA': { id: 'swsh3', serie: 'swsh', name: 'Darkness Ablaze' },
  'CPA': { id: 'swsh3.5', serie: 'swsh', name: "Champion's Path" },
  'VIV': { id: 'swsh4', serie: 'swsh', name: 'Vivid Voltage' },
  'SHF': { id: 'swsh4.5', serie: 'swsh', name: 'Shining Fates' },
  'BST': { id: 'swsh5', serie: 'swsh', name: 'Battle Styles' },
  'CRE': { id: 'swsh6', serie: 'swsh', name: 'Chilling Reign' },
  'EVS': { id: 'swsh7', serie: 'swsh', name: 'Evolving Skies' },
  'FST': { id: 'swsh8', serie: 'swsh', name: 'Fusion Strike' },
  'BRS': { id: 'swsh9', serie: 'swsh', name: 'Brilliant Stars' },
  'ASR': { id: 'swsh10', serie: 'swsh', name: 'Astral Radiance' },
  'PGO': { id: 'swsh10.5', serie: 'swsh', name: 'Pokémon GO' },
  'LOR': { id: 'swsh11', serie: 'swsh', name: 'Lost Origin' },
  'SIT': { id: 'swsh12', serie: 'swsh', name: 'Silver Tempest' },
  'CRZ': { id: 'swsh12.5', serie: 'swsh', name: 'Crown Zenith' },
  'PR-SW': { id: 'swshp', serie: 'swsh', name: 'SWSH Black Star Promos' },
  'SWSHP': { id: 'swshp', serie: 'swsh', name: 'SWSH Black Star Promos' },

  // Sun & Moon
  'SUM': { id: 'sm1', serie: 'sm', name: 'Sun & Moon' },
  'GRI': { id: 'sm2', serie: 'sm', name: 'Guardians Rising' },
  'BUS': { id: 'sm3', serie: 'sm', name: 'Burning Shadows' },
  'CIN': { id: 'sm4', serie: 'sm', name: 'Crimson Invasion' },
  'UPR': { id: 'sm5', serie: 'sm', name: 'Ultra Prism' },
  'FLI': { id: 'sm6', serie: 'sm', name: 'Forbidden Light' },
  'CES': { id: 'sm7', serie: 'sm', name: 'Celestial Storm' },
  'DRM': { id: 'sm7.5', serie: 'sm', name: 'Dragon Majesty' },
  'LOT': { id: 'sm8', serie: 'sm', name: 'Lost Thunder' },
  'TEU': { id: 'sm9', serie: 'sm', name: 'Team Up' },
  'UNB': { id: 'sm10', serie: 'sm', name: 'Unbroken Bonds' },
  'UNM': { id: 'sm11', serie: 'sm', name: 'Unified Minds' },
  'HIF': { id: 'sm115', serie: 'sm', name: 'Hidden Fates' },
  'CEC': { id: 'sm12', serie: 'sm', name: 'Cosmic Eclipse' },
  'PR-SM': { id: 'smp', serie: 'sm', name: 'SM Black Star Promos' },
};

const ENERGY_SYMBOLS: Record<string, string> = {
  '{G}': 'Grass',
  '{R}': 'Fire',
  '{W}': 'Water',
  '{L}': 'Lightning',
  '{P}': 'Psychic',
  '{F}': 'Fighting',
  '{D}': 'Darkness',
  '{M}': 'Metal',
  '{C}': 'Colorless',
  '{Y}': 'Fairy',
};

export function normalizeEnergyName(name: string): string {
  let clean = name;
  for (const [sym, type] of Object.entries(ENERGY_SYMBOLS)) {
    if (clean.includes(sym)) {
      clean = clean.replace(sym, type);
    }
  }
  return clean;
}

import { getLimitlessCardImageSync } from './limitlessResolver';

export function getQuickCardImage(set: string, number: string): string | undefined {
  const limitlessImg = getLimitlessCardImageSync(set, number);
  if (limitlessImg) {
    return limitlessImg;
  }

  const setUpper = (set || '').toUpperCase().trim();
  const cleanNum = (number || '').replace(/^0+/, '');
  const paddedNum = cleanNum.padStart(3, '0');

  // Limitless set code mapping
  let limitlessSet = setUpper;
  if (setUpper === 'PR-SW' || setUpper === 'SWSHP') limitlessSet = 'SP';
  else if (setUpper === 'PR-SV' || setUpper === 'SVP') limitlessSet = 'SVP';
  else if (setUpper === 'PR-SM' || setUpper === 'SMP') limitlessSet = 'SMP';
  else if (setUpper === 'PR-XY' || setUpper === 'XYP') limitlessSet = 'XYP';
  else if (setUpper === 'PR-BW' || setUpper === 'BWP') limitlessSet = 'BWP';

  // For SP (SWSH promos), Limitless uses unpadded number, e.g. SP_251_R_EN_SM.png
  if (limitlessSet === 'SP') {
    return `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/SP/SP_${cleanNum}_R_EN_SM.png`;
  }

  // Direct Limitless CDN candidate for all standard official expansions
  if (limitlessSet && cleanNum) {
    return `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/tpci/${limitlessSet}/${limitlessSet}_${paddedNum}_R_EN_SM.png`;
  }

  const setInfo = PTCGL_SET_MAP[setUpper];
  if (setInfo) {
    return `https://assets.tcgdex.net/en/${setInfo.serie}/${setInfo.id}/${paddedNum}/high.webp`;
  }
  return undefined;
}

/**
 * Parses PTCGL / Limitless standard deck export format (English & Spanish):
 * Pokémon: 8
 * 1 Greninja ex MEP 99
 * ...
 * Entrenador: 16 (or Trainer: 16)
 * 2 Buddy-Buddy Poffin TWM 223
 * ...
 * Energía: 2 (or Energy: 2)
 * 10 Basic {W} Energy MEE 3
 * Cartas totales: 60
 */
export function parsePtcglDeck(text: string): ParsedDeck {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const cards: ParsedDeckCard[] = [];

  let currentCategory: 'pokemon' | 'trainer' | 'energy' = 'pokemon';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const lower = line.toLowerCase();

    // Section headers (English & Spanish)
    if (lower.startsWith('pokémon:') || lower.startsWith('pokemon:')) {
      currentCategory = 'pokemon';
      continue;
    }
    if (
      lower.startsWith('trainer:') ||
      lower.startsWith('trainers:') ||
      lower.startsWith('entrenador:') ||
      lower.startsWith('entrenadores:')
    ) {
      currentCategory = 'trainer';
      continue;
    }
    if (
      lower.startsWith('energy:') ||
      lower.startsWith('energies:') ||
      lower.startsWith('energía:') ||
      lower.startsWith('energia:') ||
      lower.startsWith('energías:') ||
      lower.startsWith('energias:')
    ) {
      currentCategory = 'energy';
      continue;
    }
    if (
      lower.startsWith('cartas totales:') ||
      lower.startsWith('cartas:') ||
      lower.startsWith('total cards:') ||
      lower.startsWith('total:') ||
      lower.startsWith('deck:') ||
      lower.startsWith('mazo:')
    ) {
      continue;
    }

    // Standard PTCGL line: [count] [card name...] [set code] [card number] [optional tags]
    // Greedy match on name: ^(\d+)\s+(.+)\s+([A-Za-z0-9.-]{2,8})\s+(\d+|[A-Za-z0-9-]+)(?:\s+[A-Za-z0-9]+)?$
    const match = line.match(/^(\d+)\s+(.+)\s+([A-Za-z0-9.-]{2,8})\s+(\d+|[A-Za-z0-9-]+)(?:\s+[A-Za-z0-9]+)?$/);
    if (match) {
      const count = parseInt(match[1], 10) || 1;
      let name = match[2].trim();
      const set = match[3].trim().toUpperCase();
      const number = match[4].trim();

      if (currentCategory === 'energy' || name.includes('{')) {
        name = normalizeEnergyName(name);
      }

      const image = getQuickCardImage(set, number);

      cards.push({
        count,
        name,
        set,
        number,
        category: currentCategory,
        image,
      });
    } else {
      // Fallback: line without set/number, e.g. "4 Ultra Ball"
      const simpleMatch = line.match(/^(\d+)\s+(.+)$/);
      if (simpleMatch) {
        let name = simpleMatch[2].trim();
        if (currentCategory === 'energy' || name.includes('{')) {
          name = normalizeEnergyName(name);
        }
        cards.push({
          count: parseInt(simpleMatch[1], 10) || 1,
          name,
          set: 'PROMO',
          number: '1',
          category: currentCategory,
        });
      }
    }
  }

  const pokemonCount = cards.filter((c) => c.category === 'pokemon').reduce((a, b) => a + b.count, 0);
  const trainerCount = cards.filter((c) => c.category === 'trainer').reduce((a, b) => a + b.count, 0);
  const energyCount = cards.filter((c) => c.category === 'energy').reduce((a, b) => a + b.count, 0);

  return {
    cards,
    totalCards: pokemonCount + trainerCount + energyCount,
    pokemonCount,
    trainerCount,
    energyCount,
  };
}

/**
 * Exports deck cards array into standard PTCGL / Limitless format text
 */
export function exportToPtcgl(cards: Array<{ card_name: string; expansion: string; number: string; count: number; category: string }>): string {
  const pokemons = cards.filter((c) => c.category === 'pokemon');
  const trainers = cards.filter((c) => c.category === 'trainer');
  const energies = cards.filter((c) => c.category === 'energy');

  let output = '';

  if (pokemons.length > 0) {
    const totalPkm = pokemons.reduce((acc, c) => acc + c.count, 0);
    output += `Pokémon: ${totalPkm}\n`;
    for (const c of pokemons) {
      output += `${c.count} ${c.card_name} ${c.expansion} ${c.number}\n`;
    }
    output += '\n';
  }

  if (trainers.length > 0) {
    const totalTrn = trainers.reduce((acc, c) => acc + c.count, 0);
    output += `Trainer: ${totalTrn}\n`;
    for (const c of trainers) {
      output += `${c.count} ${c.card_name} ${c.expansion} ${c.number}\n`;
    }
    output += '\n';
  }

  if (energies.length > 0) {
    const totalEng = energies.reduce((acc, c) => acc + c.count, 0);
    output += `Energy: ${totalEng}\n`;
    for (const c of energies) {
      output += `${c.count} ${c.card_name} ${c.expansion} ${c.number}\n`;
    }
  }

  return output.trim();
}
