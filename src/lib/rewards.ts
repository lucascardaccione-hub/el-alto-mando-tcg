export interface PokemonBadge {
  id: string;
  name: string;
  city: string;
  leader: string;
  type: string;
  color: string;
  glow: string;
  iconSvg: string;
}

export interface RegionGyms {
  id: string;
  name: string;
  badges: PokemonBadge[];
}

export const POKEMON_REGIONS: RegionGyms[] = [
  {
    id: 'kanto',
    name: 'Kanto',
    badges: [
      {
        id: 'boulder',
        name: 'Medalla Roca',
        city: 'Ciudad Plateada',
        leader: 'Brock',
        type: 'Roca',
        color: '#78716c',
        glow: 'rgba(120,113,108,0.5)',
        iconSvg: 'M50 15 L85 50 L50 85 L15 50 Z',
      },
      {
        id: 'cascade',
        name: 'Medalla Cascada',
        city: 'Ciudad Celeste',
        leader: 'Misty',
        type: 'Agua',
        color: '#38bdf8',
        glow: 'rgba(56,189,248,0.5)',
        iconSvg: 'M50 12 C50 12 80 50 80 66 C80 82 66 88 50 88 C34 88 20 82 20 66 C20 50 50 12 50 12 Z',
      },
      {
        id: 'thunder',
        name: 'Medalla Trueno',
        city: 'Ciudad Carmín',
        leader: 'Lt. Surge',
        type: 'Eléctrico',
        color: '#facc15',
        glow: 'rgba(250,204,21,0.6)',
        iconSvg: 'M50 10 L58 35 L85 35 L63 52 L72 82 L50 63 L28 82 L37 52 L15 35 L42 35 Z',
      },
      {
        id: 'rainbow',
        name: 'Medalla Arcoíris',
        city: 'Ciudad Azulona',
        leader: 'Erika',
        type: 'Planta',
        color: '#4ade80',
        glow: 'rgba(74,222,128,0.5)',
        iconSvg: 'M50 10 C65 25 80 35 80 50 C80 68 66 82 50 82 C34 82 20 68 20 50 C20 35 35 25 50 10 Z',
      },
      {
        id: 'soul',
        name: 'Medalla Alma',
        city: 'Ciudad Fucsia',
        leader: 'Koga',
        type: 'Veneno',
        color: '#c084fc',
        glow: 'rgba(192,132,252,0.5)',
        iconSvg: 'M25 25 C35 15 65 15 75 25 C85 35 85 65 75 75 C65 85 35 85 25 75 C15 65 15 35 25 25 Z',
      },
      {
        id: 'marsh',
        name: 'Medalla Pantano',
        city: 'Ciudad Azafrán',
        leader: 'Sabrina',
        type: 'Psíquico',
        color: '#f472b6',
        glow: 'rgba(244,114,182,0.5)',
        iconSvg: 'M50 15 L80 35 L80 70 L50 88 L20 70 L20 35 Z',
      },
      {
        id: 'volcano',
        name: 'Medalla Volcán',
        city: 'Isla Canela',
        leader: 'Blaine',
        type: 'Fuego',
        color: '#fb923c',
        glow: 'rgba(251,146,60,0.6)',
        iconSvg: 'M50 12 C60 30 78 45 78 64 C78 80 65 88 50 88 C35 88 22 80 22 64 C22 45 40 30 50 12 Z',
      },
      {
        id: 'earth',
        name: 'Medalla Tierra',
        city: 'Ciudad Verde',
        leader: 'Giovanni',
        type: 'Tierra',
        color: '#a16207',
        glow: 'rgba(161,98,7,0.5)',
        iconSvg: 'M50 10 L82 26 L82 62 L50 90 L18 62 L18 26 Z',
      },
    ],
  },
  {
    id: 'johto',
    name: 'Johto',
    badges: [
      { id: 'zephyr', name: 'Medalla Céfiro', city: 'Ciudad Malva', leader: 'Falkner', type: 'Volador', color: '#93c5fd', glow: 'rgba(147,197,253,0.5)', iconSvg: 'M50 12 L78 40 L50 88 L22 40 Z' },
      { id: 'hive', name: 'Medalla Colmena', city: 'Pueblo Azalea', leader: 'Bugsy', type: 'Bicho', color: '#a3e635', glow: 'rgba(163,230,53,0.5)', iconSvg: 'M50 15 L80 32 L80 68 L50 85 L20 68 L20 32 Z' },
      { id: 'plain', name: 'Medalla Planicie', city: 'Ciudad Trigal', leader: 'Whitney', type: 'Normal', color: '#cbd5e1', glow: 'rgba(203,213,225,0.5)', iconSvg: 'M50 18 C70 18 84 32 84 50 C84 68 70 82 50 82 C30 82 16 68 16 50 C16 32 30 18 50 18 Z' },
      { id: 'fog', name: 'Medalla Niebla', city: 'Ciudad Iris', leader: 'Morty', type: 'Fantasma', color: '#818cf8', glow: 'rgba(129,140,248,0.5)', iconSvg: 'M30 20 C40 10 60 10 70 20 C82 32 82 68 70 80 C60 90 40 90 30 80 C18 68 18 32 30 20 Z' },
      { id: 'storm', name: 'Medalla Tormenta', city: 'Ciudad Orquídea', leader: 'Chuck', type: 'Lucha', color: '#e11d48', glow: 'rgba(225,29,72,0.5)', iconSvg: 'M50 10 L85 45 L50 80 L15 45 Z' },
      { id: 'mineral', name: 'Medalla Mineral', city: 'Ciudad Olivo', leader: 'Jasmine', type: 'Acero', color: '#94a3b8', glow: 'rgba(148,163,184,0.6)', iconSvg: 'M50 12 L84 30 L84 70 L50 88 L16 70 L16 30 Z' },
      { id: 'glacier', name: 'Medalla Glaciar', city: 'Pueblo Caoba', leader: 'Pryce', type: 'Hielo', color: '#67e8f9', glow: 'rgba(103,232,249,0.5)', iconSvg: 'M50 10 L62 38 L90 50 L62 62 L50 90 L38 62 L10 50 L38 38 Z' },
      { id: 'rising', name: 'Medalla Dragón', city: 'Ciudad Endrino', leader: 'Clair', type: 'Dragón', color: '#4f46e5', glow: 'rgba(79,70,229,0.6)', iconSvg: 'M50 14 C70 14 86 30 86 50 C86 70 65 86 50 86 C35 86 14 70 14 50 C14 30 30 14 50 14 Z' },
    ],
  },
  {
    id: 'hoenn',
    name: 'Hoenn',
    badges: [
      { id: 'stone', name: 'Medalla Piedra', city: 'Ciudad Férrica', leader: 'Roxanne', type: 'Roca', color: '#a8a29e', glow: 'rgba(168,162,158,0.5)', iconSvg: 'M50 15 L82 45 L50 85 L18 45 Z' },
      { id: 'knuckle', name: 'Medalla Puño', city: 'Pueblo Azuliza', leader: 'Brawly', type: 'Lucha', color: '#f87171', glow: 'rgba(248,113,113,0.5)', iconSvg: 'M50 16 L80 34 L80 66 L50 84 L20 66 L20 34 Z' },
      { id: 'dynamo', name: 'Medalla Dinamo', city: 'Ciudad Malvalona', leader: 'Wattson', type: 'Eléctrico', color: '#fde047', glow: 'rgba(253,224,71,0.6)', iconSvg: 'M50 10 L56 38 L86 42 L62 58 L70 88 L50 68 L30 88 L38 58 L14 42 L44 38 Z' },
      { id: 'heat', name: 'Medalla Calor', city: 'Pueblo Lavacalda', leader: 'Flannery', type: 'Fuego', color: '#f97316', glow: 'rgba(249,115,22,0.6)', iconSvg: 'M50 12 C62 28 78 44 78 64 C78 78 65 88 50 88 C35 88 22 78 22 64 C22 44 38 28 50 12 Z' },
      { id: 'balance', name: 'Medalla Equilibrio', city: 'Ciudad Petalia', leader: 'Norman', type: 'Normal', color: '#e2e8f0', glow: 'rgba(226,232,240,0.5)', iconSvg: 'M50 15 L85 50 L50 85 L15 50 Z' },
      { id: 'feather', name: 'Medalla Pluma', city: 'Ciudad Arborada', leader: 'Winona', type: 'Volador', color: '#7dd3fc', glow: 'rgba(125,211,252,0.5)', iconSvg: 'M50 12 L75 45 L50 88 L25 45 Z' },
      { id: 'mind', name: 'Medalla Mente', city: 'Ciudad Algaria', leader: 'Tate & Liza', type: 'Psíquico', color: '#e879f9', glow: 'rgba(232,121,249,0.5)', iconSvg: 'M50 10 L84 32 L84 68 L50 90 L16 68 L16 32 Z' },
      { id: 'rain', name: 'Medalla Lluvia', city: 'Arrecípolis', leader: 'Wallace', type: 'Agua', color: '#0284c7', glow: 'rgba(2,132,199,0.6)', iconSvg: 'M50 14 C50 14 78 48 78 66 C78 82 65 88 50 88 C35 88 22 82 22 66 C22 48 50 14 50 14 Z' },
    ],
  },
  {
    id: 'sinnoh',
    name: 'Sinnoh',
    badges: [
      { id: 'coal', name: 'Medalla Lignito', city: 'Ciudad Pirita', leader: 'Roark', type: 'Roca', color: '#57534e', glow: 'rgba(87,83,78,0.5)', iconSvg: 'M50 18 L82 48 L50 82 L18 48 Z' },
      { id: 'forest', name: 'Medalla Bosque', city: 'Ciudad Vetusta', leader: 'Gardenia', type: 'Planta', color: '#22c55e', glow: 'rgba(34,197,94,0.6)', iconSvg: 'M50 12 C64 26 78 38 78 54 C78 70 65 86 50 86 C35 86 22 70 22 54 C22 38 36 26 50 12 Z' },
      { id: 'cobble', name: 'Medalla Adoquín', city: 'Ciudad Rocavelo', leader: 'Maylene', type: 'Lucha', color: '#f43f5e', glow: 'rgba(244,63,94,0.6)', iconSvg: 'M50 15 L80 35 L80 65 L50 85 L20 65 L20 35 Z' },
      { id: 'fen', name: 'Medalla Ciénaga', city: 'Ciudad Pradera', leader: 'Crasher Wake', type: 'Agua', color: '#0ea5e9', glow: 'rgba(14,165,233,0.6)', iconSvg: 'M50 14 C50 14 80 50 80 68 C80 82 66 88 50 88 C34 88 20 82 20 68 C20 50 50 14 50 14 Z' },
      { id: 'relic', name: 'Medalla Reliquia', city: 'Ciudad Corazón', leader: 'Fantina', type: 'Fantasma', color: '#a855f7', glow: 'rgba(168,85,247,0.6)', iconSvg: 'M50 10 L84 35 L70 85 L30 85 L16 35 Z' },
      { id: 'mine', name: 'Medalla Mina', city: 'Ciudad Canal', leader: 'Byron', type: 'Acero', color: '#64748b', glow: 'rgba(100,116,139,0.6)', iconSvg: 'M50 12 L84 32 L84 68 L50 88 L16 68 L16 32 Z' },
      { id: 'icicle', name: 'Medalla Carámbano', city: 'Ciudad Puntaneva', leader: 'Candice', type: 'Hielo', color: '#38bdf8', glow: 'rgba(56,189,248,0.6)', iconSvg: 'M50 10 L60 38 L90 50 L60 62 L50 90 L40 62 L10 50 L40 38 Z' },
      { id: 'beacon', name: 'Medalla Faro', city: 'Ciudad Marina', leader: 'Volkner', type: 'Eléctrico', color: '#eab308', glow: 'rgba(234,179,8,0.6)', iconSvg: 'M50 10 L58 36 L86 40 L64 58 L72 86 L50 68 L28 86 L36 58 L14 40 L42 36 Z' },
    ],
  },
  {
    id: 'unova',
    name: 'Teselia (Unova)',
    badges: [
      { id: 'trio', name: 'Medalla Trío', city: 'Ciudad Gres', leader: 'Cilan / Chili / Cress', type: 'Elemental', color: '#10b981', glow: 'rgba(16,185,129,0.5)', iconSvg: 'M50 15 L82 45 L50 85 L18 45 Z' },
      { id: 'basic', name: 'Medalla Base', city: 'Ciudad Esmalte', leader: 'Lenora', type: 'Normal', color: '#d1d5db', glow: 'rgba(209,213,219,0.5)', iconSvg: 'M50 15 L85 50 L50 85 L15 50 Z' },
      { id: 'insect', name: 'Medalla Élitro', city: 'Ciudad Porcelana', leader: 'Burgh', type: 'Bicho', color: '#84cc16', glow: 'rgba(132,204,22,0.6)', iconSvg: 'M50 12 L78 35 L78 68 L50 88 L22 68 L22 35 Z' },
      { id: 'bolt', name: 'Medalla Voltio', city: 'Ciudad Mayólica', leader: 'Elesa', type: 'Eléctrico', color: '#facc15', glow: 'rgba(250,204,21,0.6)', iconSvg: 'M50 10 L58 35 L86 35 L62 55 L70 85 L50 65 L30 85 L38 55 L14 35 L42 35 Z' },
      { id: 'quake', name: 'Medalla Temblor', city: 'Ciudad Fayenza', leader: 'Clay', type: 'Tierra', color: '#b45309', glow: 'rgba(180,83,9,0.6)', iconSvg: 'M50 12 L84 32 L84 68 L50 88 L16 68 L16 32 Z' },
      { id: 'jet', name: 'Medalla Jet', city: 'Ciudad Loza', leader: 'Skyla', type: 'Volador', color: '#38bdf8', glow: 'rgba(56,189,248,0.6)', iconSvg: 'M50 10 L75 42 L50 88 L25 42 Z' },
      { id: 'freeze', name: 'Medalla Candelero', city: 'Ciudad Teja', leader: 'Brycen', type: 'Hielo', color: '#06b6d4', glow: 'rgba(6,182,212,0.6)', iconSvg: 'M50 12 L60 38 L88 50 L60 62 L50 88 L40 62 L12 50 L40 38 Z' },
      { id: 'legend', name: 'Medalla Leyenda', city: 'Ciudad Caolín', leader: 'Drayden / Iris', type: 'Dragón', color: '#6366f1', glow: 'rgba(99,102,241,0.6)', iconSvg: 'M50 10 L86 35 L72 88 L28 88 L14 35 Z' },
    ],
  },
  {
    id: 'kalos',
    name: 'Kalos',
    badges: [
      { id: 'bug', name: 'Medalla Insecto', city: 'Ciudad Novarte', leader: 'Viola', type: 'Bicho', color: '#a3e635', glow: 'rgba(163,230,53,0.5)', iconSvg: 'M50 15 L78 35 L78 68 L50 88 L22 68 L22 35 Z' },
      { id: 'cliff', name: 'Medalla Muro', city: 'Ciudad Relieve', leader: 'Grant', type: 'Roca', color: '#78716c', glow: 'rgba(120,113,108,0.5)', iconSvg: 'M50 15 L85 50 L50 85 L15 50 Z' },
      { id: 'rumble', name: 'Medalla Lid', city: 'Ciudad Yantra', leader: 'Korrina', type: 'Lucha', color: '#ef4444', glow: 'rgba(239,68,68,0.6)', iconSvg: 'M50 15 L80 35 L80 65 L50 85 L20 65 L20 35 Z' },
      { id: 'plant', name: 'Medalla Hoja', city: 'Ciudad Témpera', leader: 'Ramos', type: 'Planta', color: '#16a34a', glow: 'rgba(22,163,74,0.6)', iconSvg: 'M50 12 C64 26 78 38 78 54 C78 70 65 86 50 86 C35 86 22 70 22 54 C22 38 36 26 50 12 Z' },
      { id: 'voltage', name: 'Medalla Voltaje', city: 'Ciudad Luminalia', leader: 'Clemont', type: 'Eléctrico', color: '#eab308', glow: 'rgba(234,179,8,0.6)', iconSvg: 'M50 10 L58 36 L86 40 L64 58 L72 86 L50 68 L28 86 L36 58 L14 40 L42 36 Z' },
      { id: 'fairy', name: 'Medalla Hada', city: 'Ciudad Romantis', leader: 'Valerie', type: 'Hada', color: '#f472b6', glow: 'rgba(244,114,182,0.6)', iconSvg: 'M50 15 C70 15 85 30 85 50 C85 70 70 85 50 85 C30 85 15 70 15 50 C15 30 30 15 50 15 Z' },
      { id: 'psychic', name: 'Medalla Psique', city: 'Ciudad Fluxus', leader: 'Olympia', type: 'Psíquico', color: '#c084fc', glow: 'rgba(192,132,252,0.6)', iconSvg: 'M50 10 L84 32 L84 68 L50 90 L16 68 L16 32 Z' },
      { id: 'iceberg', name: 'Medalla Iceberg', city: 'Ciudad Fractal', leader: 'Wulfric', type: 'Hielo', color: '#0ea5e9', glow: 'rgba(14,165,233,0.6)', iconSvg: 'M50 12 L60 38 L88 50 L60 62 L50 88 L40 62 L12 50 L40 38 Z' },
    ],
  },
  {
    id: 'alola',
    name: 'Alola (Cristales Z)',
    badges: [
      { id: 'normal-z', name: 'Normastal Z', city: 'Isla Melemele', leader: 'Ilima', type: 'Normal', color: '#cbd5e1', glow: 'rgba(203,213,225,0.5)', iconSvg: 'M50 15 L85 50 L50 85 L15 50 Z' },
      { id: 'fight-z', name: 'Fitostal Z', city: 'Isla Melemele', leader: 'Kahu Kaudan', type: 'Lucha', color: '#f87171', glow: 'rgba(248,113,113,0.5)', iconSvg: 'M50 15 L80 35 L80 65 L50 85 L20 65 L20 35 Z' },
      { id: 'water-z', name: 'Hidrostal Z', city: 'Isla Akala', leader: 'Lana', type: 'Agua', color: '#38bdf8', glow: 'rgba(56,189,248,0.6)', iconSvg: 'M50 14 C50 14 78 48 78 66 C78 82 65 88 50 88 C35 88 22 82 22 66 C22 48 50 14 50 14 Z' },
      { id: 'fire-z', name: 'Pirostal Z', city: 'Isla Akala', leader: 'Kiawe', type: 'Fuego', color: '#fb923c', glow: 'rgba(251,146,60,0.6)', iconSvg: 'M50 12 C60 30 78 45 78 64 C78 80 65 88 50 88 C35 88 22 80 22 64 C22 45 40 30 50 12 Z' },
      { id: 'grass-z', name: 'Fitostal Z (Planta)', city: 'Isla Akala', leader: 'Mallow', type: 'Planta', color: '#4ade80', glow: 'rgba(74,222,128,0.6)', iconSvg: 'M50 10 C65 25 80 35 80 50 C80 68 66 82 50 82 C34 82 20 68 20 50 C20 35 35 25 50 10 Z' },
      { id: 'rock-z', name: 'Litostal Z', city: 'Isla Akala', leader: 'Kahuna Mayla', type: 'Roca', color: '#a8a29e', glow: 'rgba(168,162,158,0.5)', iconSvg: 'M50 15 L85 50 L50 85 L15 50 Z' },
      { id: 'electr-z', name: 'Electrostal Z', city: 'Isla Ula-Ula', leader: 'Sophocles', type: 'Eléctrico', color: '#facc15', glow: 'rgba(250,204,21,0.6)', iconSvg: 'M50 10 L58 35 L85 35 L63 52 L72 82 L50 63 L28 82 L37 52 L15 35 L42 35 Z' },
      { id: 'ghost-z', name: 'Espectrostal Z', city: 'Isla Ula-Ula', leader: 'Acerola', type: 'Fantasma', color: '#818cf8', glow: 'rgba(129,140,248,0.6)', iconSvg: 'M30 20 C40 10 60 10 70 20 C82 32 82 68 70 80 C60 90 40 90 30 80 C18 68 18 32 30 20 Z' },
    ],
  },
  {
    id: 'galar',
    name: 'Galar',
    badges: [
      { id: 'grass-g', name: 'Medalla Planta', city: 'Pueblo Hoyuelo', leader: 'Milo', type: 'Planta', color: '#22c55e', glow: 'rgba(34,197,94,0.6)', iconSvg: 'M50 10 C65 25 80 35 80 50 C80 68 66 82 50 82 C34 82 20 68 20 50 C20 35 35 25 50 10 Z' },
      { id: 'water-g', name: 'Medalla Agua', city: 'Pueblo Amura', leader: 'Nessa', type: 'Agua', color: '#0284c7', glow: 'rgba(2,132,199,0.6)', iconSvg: 'M50 14 C50 14 78 48 78 66 C78 82 65 88 50 88 C35 88 22 82 22 66 C22 48 50 14 50 14 Z' },
      { id: 'fire-g', name: 'Medalla Fuego', city: 'Ciudad Pistón', leader: 'Kabu', type: 'Fuego', color: '#ea580c', glow: 'rgba(234,88,12,0.6)', iconSvg: 'M50 12 C60 30 78 45 78 64 C78 80 65 88 50 88 C35 88 22 80 22 64 C22 45 40 30 50 12 Z' },
      { id: 'fight-g', name: 'Medalla Lucha', city: 'Pueblo Ladera', leader: 'Bea', type: 'Lucha', color: '#dc2626', glow: 'rgba(220,38,38,0.6)', iconSvg: 'M50 15 L80 35 L80 65 L50 85 L20 65 L20 35 Z' },
      { id: 'fairy-g', name: 'Medalla Hada', city: 'Pueblo Plié', leader: 'Opal', type: 'Hada', color: '#ec4899', glow: 'rgba(236,72,153,0.6)', iconSvg: 'M50 15 C70 15 85 30 85 50 C85 70 70 85 50 85 C30 85 15 70 15 50 C15 30 30 15 50 15 Z' },
      { id: 'rock-g', name: 'Medalla Roca', city: 'Pueblo Auriga', leader: 'Gordie', type: 'Roca', color: '#78716c', glow: 'rgba(120,113,108,0.5)', iconSvg: 'M50 15 L85 50 L50 85 L15 50 Z' },
      { id: 'dark-g', name: 'Medalla Siniestro', city: 'Pueblo Crampón', leader: 'Piers', type: 'Siniestro', color: '#475569', glow: 'rgba(71,85,105,0.6)', iconSvg: 'M50 10 L84 32 L84 68 L50 90 L16 68 L16 32 Z' },
      { id: 'dragon-g', name: 'Medalla Dragón', city: 'Ciudad Puntera / Artejo', leader: 'Raihan', type: 'Dragón', color: '#4338ca', glow: 'rgba(67,56,202,0.6)', iconSvg: 'M50 10 L86 35 L72 88 L28 88 L14 35 Z' },
    ],
  },
  {
    id: 'paldea',
    name: 'Paldea',
    badges: [
      { id: 'bug-p', name: 'Medalla Bicho', city: 'Pueblo Pirotín', leader: 'Katy', type: 'Bicho', color: '#84cc16', glow: 'rgba(132,204,22,0.6)', iconSvg: 'M50 15 L78 35 L78 68 L50 88 L22 68 L22 35 Z' },
      { id: 'grass-p', name: 'Medalla Planta', city: 'Pueblo Altamía', leader: 'Brassius', type: 'Planta', color: '#16a34a', glow: 'rgba(22,163,74,0.6)', iconSvg: 'M50 10 C65 25 80 35 80 50 C80 68 66 82 50 82 C34 82 20 68 20 50 C20 35 35 25 50 10 Z' },
      { id: 'electric-p', name: 'Medalla Eléctrico', city: 'Ciudad Leudal', leader: 'Iono (E-Nigma)', type: 'Eléctrico', color: '#fde047', glow: 'rgba(253,224,71,0.7)', iconSvg: 'M50 10 L58 35 L85 35 L63 52 L72 82 L50 63 L28 82 L37 52 L15 35 L42 35 Z' },
      { id: 'water-p', name: 'Medalla Agua', city: 'Ciudad Cántara', leader: 'Kofu', type: 'Agua', color: '#0284c7', glow: 'rgba(2,132,199,0.6)', iconSvg: 'M50 14 C50 14 78 48 78 66 C78 82 65 88 50 88 C35 88 22 82 22 66 C22 48 50 14 50 14 Z' },
      { id: 'normal-p', name: 'Medalla Normal', city: 'Pueblo Mesta', leader: 'Larry', type: 'Normal', color: '#94a3b8', glow: 'rgba(148,163,184,0.6)', iconSvg: 'M50 15 L85 50 L50 85 L15 50 Z' },
      { id: 'ghost-p', name: 'Medalla Fantasma', city: 'Pueblo Hozkailu', leader: 'Ryme', type: 'Fantasma', color: '#818cf8', glow: 'rgba(129,140,248,0.6)', iconSvg: 'M30 20 C40 10 60 10 70 20 C82 32 82 68 70 80 C60 90 40 90 30 80 C18 68 18 32 30 20 Z' },
      { id: 'psychic-p', name: 'Medalla Psíquico', city: 'Pueblo Alforno', leader: 'Tulip', type: 'Psíquico', color: '#d946ef', glow: 'rgba(217,70,239,0.6)', iconSvg: 'M50 10 L84 32 L84 68 L50 90 L16 68 L16 32 Z' },
      { id: 'ice-p', name: 'Medalla Hielo', city: 'Sierra Napada', leader: 'Grusha', type: 'Hielo', color: '#38bdf8', glow: 'rgba(56,189,248,0.6)', iconSvg: 'M50 12 L60 38 L88 50 L60 62 L50 88 L40 62 L12 50 L40 38 Z' },
    ],
  },
];

// Flat list of base badges across all 9 canonical regions (9 * 8 = 72 base badges!)
export const ALL_BASE_BADGES: Array<PokemonBadge & { regionName: string; regionIndex: number; badgeIndex: number }> =
  POKEMON_REGIONS.flatMap((region, rIdx) =>
    region.badges.map((b, bIdx) => ({
      ...b,
      regionName: region.name,
      regionIndex: rIdx,
      badgeIndex: bIdx,
    }))
  );

export const TOTAL_BASE_BADGES = ALL_BASE_BADGES.length; // 72

export type PrestigeTier = 'standard' | 'gold' | 'platinum';

export interface UserLevelInfo {
  level: number;
  exp: number;
  expCurrentLevel: number;
  expNextLevel: number;
  progressPercent: number;
  prestigeTier: PrestigeTier;
  prestigeLoop: number;
  currentBadge: PokemonBadge & {
    regionName: string;
    prestigeTier: PrestigeTier;
    prestigeLabel: string;
    badgeNumberOverall: number;
  };
  totalBadgesUnlocked: number;
}

/**
 * Calculates EXP from user interactions:
 * - Decks created: 50 EXP each
 * - Comments/hilos left: 15 EXP each
 * - Likes given: 5 EXP each
 * - Orders completed in Store: 100 EXP each
 * - Total spent in Store: 1 EXP per $100 ARS spent
 */
export function calculateExp(stats: {
  decksCount?: number;
  commentsCount?: number;
  likesCount?: number;
  ordersCount?: number;
  totalSpent?: number;
}): number {
  const decks = Math.max(0, stats.decksCount || 0);
  const comments = Math.max(0, stats.commentsCount || 0);
  const likes = Math.max(0, stats.likesCount || 0);
  const orders = Math.max(0, stats.ordersCount || 0);
  const spent = Math.max(0, stats.totalSpent || 0);

  return (
    decks * 50 +
    comments * 15 +
    likes * 5 +
    orders * 100 +
    Math.floor(spent / 100)
  );
}

/**
 * EXP needed to reach level N:
 * Level 1 starts at 0 exp.
 * Each level requires a smooth curve: base 60 exp + (level * 25)
 */
export function getExpForLevel(level: number): number {
  if (level <= 1) return 0;
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += 60 + i * 25;
  }
  return total;
}

export function getUserLevelInfo(totalExp: number): UserLevelInfo {
  const exp = Math.max(0, totalExp);
  let level = 1;

  while (getExpForLevel(level + 1) <= exp) {
    level++;
  }

  const expThisLevel = getExpForLevel(level);
  const expNextLevel = getExpForLevel(level + 1);
  const diff = expNextLevel - expThisLevel;
  const currentLevelProgress = exp - expThisLevel;
  const progressPercent = diff > 0 ? Math.min(100, Math.floor((currentLevelProgress / diff) * 100)) : 100;

  // Level 1 = Badge 1 (Boulder Badge / Kanto 1)
  const zeroBasedLevel = level - 1;
  const badgeIndex = zeroBasedLevel % TOTAL_BASE_BADGES;
  const prestigeLoop = Math.floor(zeroBasedLevel / TOTAL_BASE_BADGES);

  let prestigeTier: PrestigeTier = 'standard';
  let prestigeLabel = 'Normal';
  if (prestigeLoop === 1) {
    prestigeTier = 'gold';
    prestigeLabel = 'Dorado ⭐';
  } else if (prestigeLoop >= 2) {
    prestigeTier = 'platinum';
    prestigeLabel = `Platino 👑${prestigeLoop > 2 ? ` (+${prestigeLoop - 2})` : ''}`;
  }

  const baseBadge = ALL_BASE_BADGES[badgeIndex];

  return {
    level,
    exp,
    expCurrentLevel: currentLevelProgress,
    expNextLevel: diff,
    progressPercent,
    prestigeTier,
    prestigeLoop,
    currentBadge: {
      ...baseBadge,
      prestigeTier,
      prestigeLabel,
      badgeNumberOverall: (zeroBasedLevel % 8) + 1,
    },
    totalBadgesUnlocked: level,
  };
}
