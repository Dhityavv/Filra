export const ARCADE_GAMES = [
  {
    key: 'guess-movie',
    title: 'Guess the Movie',
    category: 'Visual puzzle',
    description: 'Kenali film dari poster yang disamarkan dan buka petunjuk seperlunya.',
    accent: 'violet',
    modes: ['normal', 'timed', 'daily'],
    href: '/arcade/games/guess-movie',
    icon: '01',
  },
  {
    key: 'trivia',
    title: 'Movie Trivia',
    category: 'Knowledge',
    description: 'Uji ingatanmu tentang film, karakter, sutradara, dan para pemainnya.',
    accent: 'cyan',
    modes: ['ten', 'endless', 'daily'],
    href: '/arcade/games/trivia',
    icon: '02',
  },
  {
    key: 'higher-lower',
    title: 'Higher or Lower',
    category: 'Head to head',
    description: 'Tebak film mana yang lebih populer atau punya rating lebih tinggi.',
    accent: 'pink',
    modes: ['endless', 'high-score'],
    href: '/arcade/games/higher-lower',
    icon: '03',
  },
  {
    key: 'emoji',
    title: 'Guess by Emoji',
    category: 'Emoji riddle',
    description: 'Rangkai petunjuk emoji menjadi judul film yang tepat.',
    accent: 'gold',
    modes: ['five', 'daily'],
    href: '/arcade/games/emoji',
    icon: '04',
  },
  {
    key: 'movie-wordle',
    title: 'Movie Wordle',
    category: 'Word puzzle',
    description: 'Temukan judul film lima huruf sebelum kesempatanmu habis.',
    accent: 'green',
    modes: ['daily', 'practice'],
    href: '/arcade/games/movie-wordle',
    icon: '05',
  },
];

export const GAME_MODES = {
  'guess-movie': {
    normal: { label: 'Normal', questions: 5 },
    timed: { label: 'Timed · 60 sec', questions: 5 },
    daily: { label: 'Daily challenge', questions: 5 },
  },
  trivia: {
    ten: { label: '10 questions', questions: 10 },
    endless: { label: 'Endless', questions: 50 },
    daily: { label: 'Daily challenge', questions: 10 },
  },
  'higher-lower': {
    endless: { label: 'Endless', questions: 50 },
    'high-score': { label: 'High score', questions: 50 },
  },
  emoji: {
    five: { label: '5 rounds', questions: 5 },
    daily: { label: 'Daily challenge', questions: 5 },
  },
  'movie-wordle': {
    daily: { label: 'Daily challenge', questions: 1 },
    practice: { label: 'Unlimited practice', questions: 1 },
  },
};

export function normalizeAnswer(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}
