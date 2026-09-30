export interface AvatarPreset {
  id: string;
  name: string;
  url: string;
  category: 'pokemon' | 'trainer';
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'pikachu',
    name: 'Pikachu',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
    category: 'pokemon',
  },
  {
    id: 'charizard',
    name: 'Charizard',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
    category: 'pokemon',
  },
  {
    id: 'gengar',
    name: 'Gengar',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png',
    category: 'pokemon',
  },
  {
    id: 'mewtwo',
    name: 'Mewtwo',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
    category: 'pokemon',
  },
  {
    id: 'umbreon',
    name: 'Umbreon',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/197.png',
    category: 'pokemon',
  },
  {
    id: 'lucario',
    name: 'Lucario',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png',
    category: 'pokemon',
  },
  {
    id: 'rayquaza',
    name: 'Rayquaza',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png',
    category: 'pokemon',
  },
  {
    id: 'arceus',
    name: 'Arceus',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/493.png',
    category: 'pokemon',
  },
  {
    id: 'garchomp',
    name: 'Garchomp',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/445.png',
    category: 'pokemon',
  },
  {
    id: 'eevee',
    name: 'Eevee',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png',
    category: 'pokemon',
  },
  {
    id: 'lugia',
    name: 'Lugia',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png',
    category: 'pokemon',
  },
  {
    id: 'mew',
    name: 'Mew',
    url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/151.png',
    category: 'pokemon',
  },
  {
    id: 'red',
    name: 'Red (Entrenador)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/red.png',
    category: 'trainer',
  },
  {
    id: 'blue',
    name: 'Blue (Campeón)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/blue.png',
    category: 'trainer',
  },
  {
    id: 'cynthia',
    name: 'Cynthia (Campeona)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/cynthia.png',
    category: 'trainer',
  },
  {
    id: 'steven',
    name: 'Steven Stone (Campeón)',
    url: 'https://play.pokemonshowdown.com/sprites/trainers/steven.png',
    category: 'trainer',
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
