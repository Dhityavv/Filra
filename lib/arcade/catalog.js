import 'server-only';
import { GAME_MODES } from './definitions';

const TRIVIA_BANK = [
  {
    category: 'Director',
    prompt: 'Siapa sutradara film Jurassic Park (1993)?',
    choices: ['Steven Spielberg', 'James Cameron', 'George Lucas', 'Tim Burton'],
    answer: 'Steven Spielberg',
    explanation: 'Steven Spielberg menyutradarai Jurassic Park yang diadaptasi dari novel Michael Crichton.',
  },
  {
    category: 'Actor',
    prompt: 'Siapa yang memerankan Tony Stark di film-film Marvel Cinematic Universe?',
    choices: ['Chris Evans', 'Robert Downey Jr.', 'Mark Ruffalo', 'Chris Hemsworth'],
    answer: 'Robert Downey Jr.',
    explanation: 'Robert Downey Jr. memerankan Tony Stark, alias Iron Man.',
  },
  {
    category: 'Animation',
    prompt: 'Apa nama kerajaan dalam film Frozen?',
    choices: ['Corona', 'Arendelle', 'Genovia', 'DunBroch'],
    answer: 'Arendelle',
    explanation: 'Anna dan Elsa adalah putri dari kerajaan fiktif Arendelle.',
  },
  {
    category: 'Director',
    prompt: 'Siapa sutradara Spirited Away?',
    choices: ['Makoto Shinkai', 'Mamoru Hosoda', 'Hayao Miyazaki', 'Isao Takahata'],
    answer: 'Hayao Miyazaki',
    explanation: 'Film animasi Studio Ghibli ini ditulis dan disutradarai Hayao Miyazaki.',
  },
  {
    category: 'Character',
    prompt: 'Apa nama planet asal Luke Skywalker di Star Wars?',
    choices: ['Hoth', 'Naboo', 'Tatooine', 'Endor'],
    answer: 'Tatooine',
    explanation: 'Luke tumbuh besar di Tatooine, planet gurun di Outer Rim.',
  },
  {
    category: 'Actor',
    prompt: 'Siapa pengisi suara Woody dalam film Toy Story versi bahasa Inggris?',
    choices: ['Tom Hanks', 'Tim Allen', 'Billy Crystal', 'Robin Williams'],
    answer: 'Tom Hanks',
    explanation: 'Tom Hanks mengisi suara Woody, sementara Tim Allen mengisi suara Buzz Lightyear.',
  },
  {
    category: 'Character',
    prompt: 'Siapa nama burung hantu peliharaan Harry Potter?',
    choices: ['Crookshanks', 'Fawkes', 'Hedwig', 'Errol'],
    answer: 'Hedwig',
    explanation: 'Hedwig adalah burung hantu salju yang menemani Harry.',
  },
  {
    category: 'Director',
    prompt: 'Siapa sutradara Pulp Fiction?',
    choices: ['Martin Scorsese', 'Quentin Tarantino', 'David Fincher', 'Paul Thomas Anderson'],
    answer: 'Quentin Tarantino',
    explanation: 'Pulp Fiction ditulis dan disutradarai Quentin Tarantino.',
  },
  {
    category: 'Setting',
    prompt: 'Di kota fiktif mana sebagian besar cerita The Dark Knight berlangsung?',
    choices: ['Metropolis', 'Star City', 'Gotham City', 'Central City'],
    answer: 'Gotham City',
    explanation: 'Batman melindungi Gotham City, kota fiktif yang juga muncul dalam banyak kisah DC.',
  },
  {
    category: 'Actor',
    prompt: 'Siapa yang memerankan Hermione Granger dalam seri film Harry Potter?',
    choices: ['Emma Watson', 'Keira Knightley', 'Bonnie Wright', 'Carey Mulligan'],
    answer: 'Emma Watson',
    explanation: 'Emma Watson memerankan Hermione Granger di delapan film utama Harry Potter.',
  },
  {
    category: 'Setting',
    prompt: 'Apa nama hotel dalam film The Shining?',
    choices: ['Bates Motel', 'Overlook Hotel', 'Grand Budapest Hotel', 'Hotel Earle'],
    answer: 'Overlook Hotel',
    explanation: 'Keluarga Torrance mengelola Overlook Hotel yang terisolasi selama musim dingin.',
  },
  {
    category: 'Character',
    prompt: 'Apa nama kapal dalam film Titanic (1997)?',
    choices: ['RMS Lusitania', 'RMS Olympic', 'RMS Titanic', 'SS Californian'],
    answer: 'RMS Titanic',
    explanation: 'Film James Cameron berlatar pelayaran perdana RMS Titanic pada 1912.',
  },
  {
    category: 'Director',
    prompt: 'Siapa sutradara film Get Out?',
    choices: ['Jordan Peele', 'Ryan Coogler', 'Ari Aster', 'M. Night Shyamalan'],
    answer: 'Jordan Peele',
    explanation: 'Get Out adalah debut penyutradaraan film panjang Jordan Peele.',
  },
  {
    category: 'Character',
    prompt: 'Apa nama ikan badut yang dicari Marlin dalam Finding Nemo?',
    choices: ['Dory', 'Nemo', 'Bloat', 'Gill'],
    answer: 'Nemo',
    explanation: 'Nemo adalah putra Marlin yang hilang dan menjadi pusat petualangan film.',
  },
  {
    category: 'Director',
    prompt: 'Siapa yang menyutradarai film Parasite (2019)?',
    choices: ['Park Chan-wook', 'Bong Joon Ho', 'Lee Chang-dong', 'Kim Jee-woon'],
    answer: 'Bong Joon Ho',
    explanation: 'Bong Joon Ho menulis dan menyutradarai Parasite.',
  },
  {
    category: 'Actor',
    prompt: 'Siapa yang memerankan Jack Dawson dalam Titanic (1997)?',
    choices: ['Matt Damon', 'Leonardo DiCaprio', 'Brad Pitt', 'Christian Bale'],
    answer: 'Leonardo DiCaprio',
    explanation: 'Leonardo DiCaprio memerankan Jack Dawson bersama Kate Winslet sebagai Rose.',
  },
  {
    category: 'Genre',
    prompt: 'Film dokumenter Free Solo terutama mengikuti olahraga apa?',
    choices: ['Selancar ombak besar', 'Panjat tebing solo', 'Balap sepeda', 'Terjun payung'],
    answer: 'Panjat tebing solo',
    explanation: 'Free Solo mengikuti pendakian Alex Honnold tanpa tali pengaman di El Capitan.',
  },
  {
    category: 'Character',
    prompt: 'Apa nama alter ego pahlawan super Shrek?',
    choices: ['Puss in Boots', 'Donkey', 'Tidak ada; Shrek adalah ogre', 'Lord Farquaad'],
    answer: 'Tidak ada; Shrek adalah ogre',
    explanation: 'Shrek adalah ogre yang menjadi tokoh utama, bukan pahlawan dengan alter ego.',
  },
];

const EMOJI_BANK = [
  { emojis: '🦁 👑 🌅', answer: 'The Lion King', explanation: 'Simba, kerajaan, dan matahari terbit mengarah ke The Lion King.' },
  { emojis: '❄️ 👭 ⛄', answer: 'Frozen', explanation: 'Kekuatan es Elsa dan Olaf adalah petunjuk utama Frozen.' },
  { emojis: '🦈 🏖️ 🚤', answer: 'Jaws', explanation: 'Ancaman hiu di pantai menjadi inti film Jaws.' },
  { emojis: '🏠 👦 🎄', answer: 'Home Alone', explanation: 'Seorang anak menjaga rumah saat keluarganya pergi pada musim liburan.' },
  { emojis: '🕷️ 🕸️ 🏙️', answer: 'Spider-Man', explanation: 'Jaring laba-laba dan kota New York menandai Spider-Man.' },
  { emojis: '🎈 🏠 👴', answer: 'Up', explanation: 'Rumah yang terbang dengan balon adalah gambaran ikonik Up.' },
  { emojis: '🐠 🌊 🔎', answer: 'Finding Nemo', explanation: 'Marlin menjelajahi laut untuk menemukan Nemo.' },
  { emojis: '⏰ 🚗 ⚡', answer: 'Back to the Future', explanation: 'DeLorean dan perjalanan waktu adalah kunci Back to the Future.' },
  { emojis: '⚡ 🧙 🏰', answer: 'Harry Potter', explanation: 'Bekas luka petir, sihir, dan Hogwarts mengarah ke Harry Potter.' },
  { emojis: '🚢 🧊 💔', answer: 'Titanic', explanation: 'Kapal, gunung es, dan kisah cinta menggambarkan Titanic.' },
  { emojis: '🦖 🏝️ 🚙', answer: 'Jurassic Park', explanation: 'Dinosaurus di pulau taman hiburan adalah Jurassic Park.' },
  { emojis: '🤠 🧸 🚀', answer: 'Toy Story', explanation: 'Woody dan Buzz adalah mainan dalam Toy Story.' },
];

const WORDLE_TITLES = [
  { answer: 'ALIEN', hint: 'Teror fiksi ilmiah di luar angkasa.', year: 1979 },
  { answer: 'ROCKY', hint: 'Kisah petinju underdog di Philadelphia.', year: 1976 },
  { answer: 'SHREK', hint: 'Ogre hijau memulai petualangan dongeng.', year: 2001 },
  { answer: 'JOKER', hint: 'Kisah asal-usul musuh ikonis Batman.', year: 2019 },
  { answer: 'MULAN', hint: 'Seorang perempuan menyamar untuk melindungi keluarganya.', year: 1998 },
  { answer: 'FARGO', hint: 'Kejahatan bersalju karya Coen bersaudara.', year: 1996 },
  { answer: 'CREED', hint: 'Petinju muda meneruskan warisan Apollo Creed.', year: 2015 },
  { answer: 'LOGAN', hint: 'Kisah Wolverine dalam perjalanan terakhirnya.', year: 2017 },
  { answer: 'BAMBI', hint: 'Rusa muda tumbuh di tengah hutan.', year: 1942 },
  { answer: 'RANGO', hint: 'Bunglon menjadi sheriff di kota gurun.', year: 2011 },
  { answer: 'GHOST', hint: 'Romansa supernatural bersama Demi Moore dan Patrick Swayze.', year: 1990 },
  { answer: 'GLORY', hint: 'Drama Perang Saudara Amerika tentang resimen sukarelawan.', year: 1989 },
  { answer: 'CRASH', hint: 'Drama ensemble yang berlatar di Los Angeles.', year: 2004 },
  { answer: 'DRIVE', hint: 'Pengemudi Hollywood menjalani hidup ganda.', year: 2011 },
];

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededShuffle(items, seed) {
  const shuffled = [...items];
  let state = hashString(seed) || 1;
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const target = state % (index + 1);
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

async function getTrendingMovies() {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error('TMDB_API_KEY belum dikonfigurasi di server.');

  const url = new URL('https://api.themoviedb.org/3/trending/movie/day');
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('language', 'en-US');
  const response = await fetch(url, { next: { revalidate: 3600 } });
  if (!response.ok) throw new Error('Data film dari TMDB gagal dimuat.');
  const payload = await response.json();
  const movies = (payload.results || [])
    .filter((movie) => movie.title && movie.poster_path && !movie.adult)
    .slice(0, 20)
    .map((movie) => ({
      id: movie.id,
      title: movie.title,
      posterPath: movie.poster_path,
      year: movie.release_date?.slice(0, 4) || '',
      overview: movie.overview || '',
      rating: Number(movie.vote_average) || 0,
      popularity: Number(movie.popularity) || 0,
    }));

  if (movies.length < 10) throw new Error('Pilihan film TMDB belum cukup untuk memulai game.');
  return movies;
}

function buildTrivia(seed, count) {
  const rounds = seededShuffle(TRIVIA_BANK, seed);
  return Array.from({ length: count }, (_, index) => {
    const item = rounds[index % rounds.length];
    return {
      prompt: item.prompt,
      category: item.category,
      choices: item.choices,
      answer: item.answer,
      explanation: item.explanation,
    };
  });
}

function buildEmoji(seed, count) {
  return seededShuffle(EMOJI_BANK, seed).slice(0, count).map((item) => ({
    prompt: item.emojis,
    answer: item.answer,
    explanation: item.explanation,
  }));
}

function buildWordle(seed, mode) {
  const item = mode === 'daily'
    ? WORDLE_TITLES[hashString(seed) % WORDLE_TITLES.length]
    : WORDLE_TITLES[Math.floor(Math.random() * WORDLE_TITLES.length)];
  return [{
    answer: item.answer,
    explanation: `${item.hint} (rilis ${item.year}).`,
  }];
}

export async function buildChallenge(gameKey, mode, seed) {
  const count = GAME_MODES[gameKey][mode].questions;
  if (gameKey === 'trivia') return buildTrivia(seed, count);
  if (gameKey === 'emoji') return buildEmoji(seed, count);
  if (gameKey === 'movie-wordle') return buildWordle(seed, mode);

  const movies = await getTrendingMovies();
  const ordered = seededShuffle(movies, seed);

  if (gameKey === 'guess-movie') {
    return ordered.slice(0, count).map((movie) => ({
      answer: movie.title,
      posterPath: movie.posterPath,
      year: movie.year,
      overview: movie.overview,
      hints: [
        movie.year ? `Film ini dirilis pada ${movie.year}.` : 'Perhatikan era dan gaya visual posternya.',
        movie.overview
          ? movie.overview.split(/[.!?]/)[0].slice(0, 150)
          : `Judulnya diawali huruf "${movie.title[0]}".`,
        `Judul terdiri dari ${movie.title.length} karakter dan diawali huruf "${movie.title[0]}".`,
      ],
    }));
  }

  if (gameKey === 'higher-lower') {
    return Array.from({ length: count }, (_, index) => {
      const left = ordered[index % ordered.length];
      let right = ordered[(index + 1) % ordered.length];
      if (right.id === left.id) right = ordered[(index + 2) % ordered.length];
      return {
        left: {
          title: left.title,
          posterPath: left.posterPath,
          rating: left.rating,
          popularity: left.popularity,
        },
        right: {
          title: right.title,
          posterPath: right.posterPath,
          rating: right.rating,
          popularity: right.popularity,
        },
        metric: index % 2 === 0 ? 'popularity' : 'rating',
      };
    });
  }

  throw new Error('Game tidak tersedia.');
}

export function getDailyChallengeDate() {
  return new Date().toISOString().slice(0, 10);
}
