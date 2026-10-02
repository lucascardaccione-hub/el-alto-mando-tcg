export interface AvatarPreset {
  id: string;
  name: string;
  url: string;
  category: 'pokemon-artwork' | 'pokemon-sprite' | 'trainer-sprite' | 'legendary';
  generation?: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  // --- CLÁSICOS OFFICIAL ARTWORK ---
  {
    id: 'art-charizard',
    name: 'Charizard',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
    category: 'pokemon-artwork',
    generation: 'Gen 1',
  },
  {
    id: 'art-pikachu',
    name: 'Pikachu',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
    category: 'pokemon-artwork',
    generation: 'Gen 1',
  },
  {
    id: 'art-gengar',
    name: 'Gengar',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png',
    category: 'pokemon-artwork',
    generation: 'Gen 1',
  },
  {
    id: 'art-eevee',
    name: 'Eevee',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png',
    category: 'pokemon-artwork',
    generation: 'Gen 1',
  },
  {
    id: 'art-mewtwo',
    name: 'Mewtwo',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
    category: 'legendary',
    generation: 'Gen 1',
  },
  {
    id: 'art-mew',
    name: 'Mew',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/151.png',
    category: 'legendary',
    generation: 'Gen 1',
  },
  {
    id: 'art-lugia',
    name: 'Lugia',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png',
    category: 'legendary',
    generation: 'Gen 2',
  },
  {
    id: 'art-umbreon',
    name: 'Umbreon',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/197.png',
    category: 'pokemon-artwork',
    generation: 'Gen 2',
  },
  {
    id: 'art-rayquaza',
    name: 'Rayquaza',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png',
    category: 'legendary',
    generation: 'Gen 3',
  },
  {
    id: 'art-garchomp',
    name: 'Garchomp',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/445.png',
    category: 'pokemon-artwork',
    generation: 'Gen 4',
  },
  {
    id: 'art-lucario',
    name: 'Lucario',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png',
    category: 'pokemon-artwork',
    generation: 'Gen 4',
  },
  {
    id: 'art-greninja',
    name: 'Greninja',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/658.png',
    category: 'pokemon-artwork',
    generation: 'Gen 6',
  },

  // --- SPRITES DE POKÉMON (Pixel Art & Animados de Combate) ---
  {
    id: 'sp-charizard',
    name: 'Charizard Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png',
    category: 'pokemon-sprite',
    generation: 'Gen 1',
  },
  {
    id: 'sp-blastoise',
    name: 'Blastoise Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/9.png',
    category: 'pokemon-sprite',
    generation: 'Gen 1',
  },
  {
    id: 'sp-venusaur',
    name: 'Venusaur Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/3.png',
    category: 'pokemon-sprite',
    generation: 'Gen 1',
  },
  {
    id: 'sp-pikachu',
    name: 'Pikachu Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
    category: 'pokemon-sprite',
    generation: 'Gen 1',
  },
  {
    id: 'sp-alakazam',
    name: 'Alakazam Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/65.png',
    category: 'pokemon-sprite',
    generation: 'Gen 1',
  },
  {
    id: 'sp-gengar',
    name: 'Gengar Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/94.png',
    category: 'pokemon-sprite',
    generation: 'Gen 1',
  },
  {
    id: 'sp-gyarados',
    name: 'Gyarados Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/130.png',
    category: 'pokemon-sprite',
    generation: 'Gen 1',
  },
  {
    id: 'sp-dragonite',
    name: 'Dragonite Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/149.png',
    category: 'pokemon-sprite',
    generation: 'Gen 1',
  },
  {
    id: 'sp-typhlosion',
    name: 'Typhlosion Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/157.png',
    category: 'pokemon-sprite',
    generation: 'Gen 2',
  },
  {
    id: 'sp-tyranitar',
    name: 'Tyranitar Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/248.png',
    category: 'pokemon-sprite',
    generation: 'Gen 2',
  },
  {
    id: 'sp-scizor',
    name: 'Scizor Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/212.png',
    category: 'pokemon-sprite',
    generation: 'Gen 2',
  },
  {
    id: 'sp-blaziken',
    name: 'Blaziken Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/257.png',
    category: 'pokemon-sprite',
    generation: 'Gen 3',
  },
  {
    id: 'sp-gardevoir',
    name: 'Gardevoir Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/282.png',
    category: 'pokemon-sprite',
    generation: 'Gen 3',
  },
  {
    id: 'sp-metagross',
    name: 'Metagross Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/376.png',
    category: 'pokemon-sprite',
    generation: 'Gen 3',
  },
  {
    id: 'sp-infernape',
    name: 'Infernape Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/392.png',
    category: 'pokemon-sprite',
    generation: 'Gen 4',
  },
  {
    id: 'sp-garchomp',
    name: 'Garchomp Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/445.png',
    category: 'pokemon-sprite',
    generation: 'Gen 4',
  },
  {
    id: 'sp-lucario',
    name: 'Lucario Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/448.png',
    category: 'pokemon-sprite',
    generation: 'Gen 4',
  },
  {
    id: 'sp-darkrai',
    name: 'Darkrai Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/491.png',
    category: 'legendary',
    generation: 'Gen 4',
  },
  {
    id: 'sp-zoroark',
    name: 'Zoroark Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/571.png',
    category: 'pokemon-sprite',
    generation: 'Gen 5',
  },
  {
    id: 'sp-greninja',
    name: 'Greninja Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/658.png',
    category: 'pokemon-sprite',
    generation: 'Gen 6',
  },
  {
    id: 'sp-mimikyu',
    name: 'Mimikyu Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/778.png',
    category: 'pokemon-sprite',
    generation: 'Gen 7',
  },
  {
    id: 'sp-dragapult',
    name: 'Dragapult Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/887.png',
    category: 'pokemon-sprite',
    generation: 'Gen 8',
  },
  {
    id: 'sp-meowscarada',
    name: 'Meowscarada Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/908.png',
    category: 'pokemon-sprite',
    generation: 'Gen 9',
  },
  {
    id: 'sp-miraidon',
    name: 'Miraidon Sprite',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1008.png',
    category: 'legendary',
    generation: 'Gen 9',
  },

  // --- SPRITES DE ENTRENADORES (Trainers & Champions) ---
  {
    id: 'tr-red',
    name: 'Red (Campeón Clásico)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/red.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-blue',
    name: 'Blue (Rival / Líder)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/blue.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-leaf',
    name: 'Leaf (Entrenadora Kanto)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/leaf.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-ethan',
    name: 'Ethan (Protagonista Johto)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/ethan.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-lyra',
    name: 'Lyra (Protagonista Johto)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/lyra.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-lance',
    name: 'Lance (Alto Mando / Campeón Dragón)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/lance.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-steven',
    name: 'Steven Stone (Campeón Hoenn)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/steven.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-cynthia',
    name: 'Cynthia (Campeona Sinnoh)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/cynthia.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-dawn',
    name: 'Dawn (Entrenadora Sinnoh)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/dawn.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-lucas',
    name: 'Lucas (Entrenador Sinnoh)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/lucas.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-n',
    name: 'N (Líder del Equipo Plasma)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/n.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-iris',
    name: 'Iris (Campeona Teselia)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/iris-gen5bw2.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-diantha',
    name: 'Diantha (Campeona Kalos)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/diantha.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-leon',
    name: 'Leon (Campeón Invicto Galar)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/leon.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-marnie',
    name: 'Marnie (Galar)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/marnie.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-geeta',
    name: 'Ságita / Geeta (Presidenta Paldea)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/geeta.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-nemona',
    name: 'Nemona (Rango Campeón Paldea)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/nemona.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-iono',
    name: 'Iono / E-Nigma (Líder / Streamer)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/iono.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-giovanni',
    name: 'Giovanni (Líder Team Rocket)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/giovanni.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-ace-trainer-m',
    name: 'Guai Masculino (Ace Trainer)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/acetrainerm.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-ace-trainer-f',
    name: 'Guai Femenina (Ace Trainer)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/acetrainerf.png',
    category: 'trainer-sprite',
  },
  {
    id: 'tr-veteran',
    name: 'Veterano Pokémon',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/veteran.png',
    category: 'trainer-sprite',
  },
];

export function getDefaultAvatar(username: string): string {
  if (!username) {
    return AVATAR_PRESETS[0].url;
  }
  // Deterministic avatar index based on username string
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PRESETS.length;
  return AVATAR_PRESETS[index].url;
}
