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

const EXTRA_TRIVIA = [
  ['Director', 'Siapa sutradara Inception?', 'Christopher Nolan', 'Christopher Nolan menulis dan menyutradarai film thriller fiksi ilmiah Inception.', ['Denis Villeneuve', 'David Fincher', 'Darren Aronofsky']],
  ['Character', 'Siapa nama karakter Leonardo DiCaprio dalam Inception?', 'Dom Cobb', 'Dom Cobb adalah pencuri yang memasuki mimpi untuk mencuri rahasia.', ['Arthur', 'Eames', 'Robert Fischer']],
  ['Director', 'Siapa sutradara 2001: A Space Odyssey?', 'Stanley Kubrick', 'Stanley Kubrick menyutradarai film fiksi ilmiah klasik ini.', ['Ridley Scott', 'George Lucas', 'Steven Spielberg']],
  ['Character', 'Siapa nama tokoh utama yang diperankan Keanu Reeves di The Matrix?', 'Neo', 'Keanu Reeves memerankan Neo, yang juga dikenal sebagai Thomas Anderson.', ['Morpheus', 'Cypher', 'Agent Smith']],
  ['Setting', 'Apa nama negara fiktif dalam Black Panther?', 'Wakanda', 'Wakanda adalah negara fiktif yang menyimpan cadangan vibranium.', ['Genovia', 'Zamunda', 'Latveria']],
  ['Actor', 'Siapa yang memerankan Frodo dalam trilogi The Lord of the Rings?', 'Elijah Wood', 'Elijah Wood memerankan Frodo Baggins dalam trilogi Peter Jackson.', ['Sean Astin', 'Orlando Bloom', 'Dominic Monaghan']],
  ['Director', 'Siapa sutradara trilogi The Lord of the Rings versi 2001–2003?', 'Peter Jackson', 'Peter Jackson menyutradarai trilogi yang difilmkan di Selandia Baru.', ['Guillermo del Toro', 'James Cameron', 'Sam Raimi']],
  ['Setting', 'Apa nama planet tempat tinggal bangsa Na’vi dalam Avatar?', 'Pandora', 'Pandora adalah bulan fiktif yang menjadi latar Avatar.', ['Arrakis', 'Endor', 'Krypton']],
  ['Character', 'Siapa nama anak yang menjadi tokoh utama film Coco?', 'Miguel', 'Miguel Rivera bermimpi menjadi musisi dalam film Coco.', ['Hector', 'Ernesto', 'Dante']],
  ['Character', 'Siapa nama tikus koki dalam Ratatouille?', 'Remy', 'Remy bercita-cita menjadi koki di Paris.', ['Emile', 'Linguini', 'Skinner']],
  ['Character', 'Apa nama emosi yang paling sering menjadi tokoh utama di Inside Out?', 'Joy', 'Joy adalah emosi berwarna kuning yang disuarakan Amy Poehler.', ['Sadness', 'Fear', 'Disgust']],
  ['Character', 'Siapa nama lengkap tokoh Carl dalam film Up?', 'Carl Fredricksen', 'Carl Fredricksen menerbangkan rumahnya dengan ribuan balon.', ['Russell Peterson', 'Charles Muntz', 'Dug Fredricksen']],
  ['Character', 'Apa jenis ikan Dory dalam Finding Nemo?', 'Blue tang', 'Dory adalah ikan blue tang yang mengalami gangguan ingatan jangka pendek.', ['Clownfish', 'Angelfish', 'Pufferfish']],
  ['Setting', 'Apa nama pulau tempat tinggal Moana?', 'Motunui', 'Moana tinggal di pulau fiktif Motunui.', ['Te Fiti', 'Maui', 'Lalotai']],
  ['Character', 'Siapa nama putri dalam Beauty and the Beast?', 'Belle', 'Belle adalah tokoh utama yang jatuh cinta pada Beast.', ['Aurora', 'Jasmine', 'Cinderella']],
  ['Actor', 'Siapa pengisi suara Genie dalam Aladdin versi animasi 1992?', 'Robin Williams', 'Robin Williams mengisi suara Genie dalam film animasi Disney tahun 1992.', ['Eddie Murphy', 'Billy Crystal', 'John Goodman']],
  ['Director', 'Siapa sutradara film Jaws?', 'Steven Spielberg', 'Steven Spielberg menyutradarai thriller hiu yang dirilis pada 1975.', ['George Lucas', 'John Carpenter', 'Brian De Palma']],
  ['Character', 'Siapa nama kepala keluarga Corleone dalam The Godfather pertama?', 'Vito Corleone', 'Marlon Brando memerankan Don Vito Corleone.', ['Michael Corleone', 'Sonny Corleone', 'Fredo Corleone']],
  ['Actor', 'Siapa aktor yang memerankan Hannibal Lecter dalam The Silence of the Lambs?', 'Anthony Hopkins', 'Anthony Hopkins memenangkan Oscar untuk peran Hannibal Lecter.', ['Jack Nicholson', 'Gene Hackman', 'Jeremy Irons']],
  ['Setting', 'Di negara bagian mana Forrest Gump dibesarkan?', 'Alabama', 'Forrest dibesarkan di Greenbow, Alabama.', ['Georgia', 'Texas', 'Tennessee']],
  ['Character', 'Siapa nama tokoh utama perempuan dalam The Wizard of Oz?', 'Dorothy Gale', 'Dorothy Gale melakukan perjalanan ke negeri Oz bersama anjingnya, Toto.', ['Alice Liddell', 'Wendy Darling', 'Mary Poppins']],
  ['Actor', 'Siapa yang memerankan Marty McFly dalam Back to the Future?', 'Michael J. Fox', 'Michael J. Fox memerankan Marty McFly dalam trilogi tersebut.', ['Eric Stoltz', 'Tom Cruise', 'Ralph Macchio']],
  ['Character', 'Siapa nama putra Sarah Connor yang menjadi tokoh penting dalam Terminator 2?', 'John Connor', 'John Connor adalah calon pemimpin perlawanan manusia di masa depan.', ['Kyle Reese', 'Miles Dyson', 'T-1000']],
  ['Character', 'Siapa nama tokoh Sigourney Weaver dalam Alien?', 'Ellen Ripley', 'Ellen Ripley menjadi salah satu tokoh utama paling ikonis dalam fiksi ilmiah.', ['Sarah Connor', 'Dana Barrett', 'Jill Valentine']],
  ['Character', 'Apa nama tokoh yang diperankan Harrison Ford dalam Blade Runner?', 'Rick Deckard', 'Rick Deckard adalah blade runner yang ditugaskan memburu para replicant.', ['Roy Batty', 'Gaff', 'J. F. Sebastian']],
  ['Actor', 'Siapa aktor utama yang memerankan Maximus dalam Gladiator (2000)?', 'Russell Crowe', 'Russell Crowe memerankan jenderal Romawi Maximus Decimus Meridius.', ['Joaquin Phoenix', 'Gerard Butler', 'Eric Bana']],
  ['Character', 'Apa nama drummer muda yang dilatih Terence Fletcher dalam Whiplash?', 'Andrew Neiman', 'Miles Teller memerankan Andrew Neiman, seorang drummer jazz.', ['Sean Casey', 'Ryan Gosling', 'Charlie Parker']],
  ['Character', 'Apa nama karakter Ryan Gosling dalam La La Land?', 'Sebastian Wilder', 'Sebastian Wilder adalah pianis jazz yang bercita-cita membuka klub.', ['Keith', 'Jacob Palmer', 'Neil Armstrong']],
  ['Director', 'Siapa sutradara Titanic (1997)?', 'James Cameron', 'James Cameron menulis dan menyutradarai film Titanic tahun 1997.', ['Ron Howard', 'Ridley Scott', 'Peter Weir']],
  ['Director', 'Siapa sutradara Pan’s Labyrinth?', 'Guillermo del Toro', 'Guillermo del Toro menyutradarai film fantasi berbahasa Spanyol ini.', ['Alfonso Cuarón', 'Alejandro G. Iñárritu', 'Pedro Almodóvar']],
  ['Character', 'Siapa nama penyihir cilik yang menjadi tokoh utama Kiki’s Delivery Service?', 'Kiki', 'Kiki pindah ke kota baru dan membuka jasa pengiriman dengan sapu terbangnya.', ['Chihiro', 'Nausicaä', 'Sophie']],
  ['Character', 'Siapa nama panda yang menjadi tokoh utama Kung Fu Panda?', 'Po', 'Po adalah panda yang terpilih menjadi Dragon Warrior.', ['Shifu', 'Tai Lung', 'Oogway']],
  ['Character', 'Apa nama penjahat utama yang ingin menjadi raja dalam film Shrek?', 'Lord Farquaad', 'Lord Farquaad memerintah Duloc dan mengusir para makhluk dongeng.', ['Prince Charming', 'Rumpelstiltskin', 'Captain Hook']],
  ['Character', 'Siapa nama alter ego superhero Elastigirl dalam The Incredibles?', 'Helen Parr', 'Helen Parr adalah Elastigirl, istri Bob Parr atau Mr. Incredible.', ['Violet Parr', 'Edna Mode', 'Mirage']],
  ['Character', 'Apa nama robot pengumpul sampah dalam film WALL-E?', 'WALL-E', 'WALL-E adalah robot yang ditinggalkan di Bumi untuk membersihkan sampah.', ['EVE', 'M-O', 'AUTO']],
  ['Director', 'Siapa sutradara 12 Angry Men (1957)?', 'Sidney Lumet', '12 Angry Men adalah debut penyutradaraan film panjang Sidney Lumet.', ['Billy Wilder', 'John Huston', 'Frank Capra']],
  ['Director', 'Siapa sutradara Goodfellas?', 'Martin Scorsese', 'Martin Scorsese menyutradarai film kriminal Goodfellas tahun 1990.', ['Brian De Palma', 'Francis Ford Coppola', 'William Friedkin']],
  ['Director', 'Siapa sutradara Se7en?', 'David Fincher', 'David Fincher menyutradarai thriller kriminal yang dibintangi Brad Pitt dan Morgan Freeman.', ['Christopher Nolan', 'Michael Mann', 'Tony Scott']],
  ['Director', 'Siapa sutradara The Grand Budapest Hotel?', 'Wes Anderson', 'Wes Anderson dikenal lewat komposisi visual simetris dan palet warna khas.', ['Noah Baumbach', 'Greta Gerwig', 'Taika Waititi']],
  ['Actor', 'Siapa yang memerankan Furiosa dalam Mad Max: Fury Road?', 'Charlize Theron', 'Charlize Theron memerankan Imperator Furiosa.', ['Emily Blunt', 'Michelle Rodriguez', 'Tilda Swinton']],
  ['Director', 'Siapa sutradara Oppenheimer (2023)?', 'Christopher Nolan', 'Christopher Nolan menulis dan menyutradarai film biografi J. Robert Oppenheimer.', ['Denis Villeneuve', 'Damien Chazelle', 'Steven Soderbergh']],
  ['Director', 'Siapa sutradara Barbie (2023)?', 'Greta Gerwig', 'Greta Gerwig menyutradarai Barbie, yang ia tulis bersama Noah Baumbach.', ['Sofia Coppola', 'Patty Jenkins', 'Emerald Fennell']],
  ['Actor', 'Siapa yang memerankan Evelyn Wang dalam Everything Everywhere All at Once?', 'Michelle Yeoh', 'Michelle Yeoh memenangkan Oscar untuk perannya sebagai Evelyn Wang.', ['Sandra Oh', 'Lucy Liu', 'Constance Wu']],
].map(([category, prompt, answer, explanation, wrongOne, wrongTwo, wrongThree]) => ({
  category,
  prompt,
  answer,
  explanation,
  choices: [answer, wrongOne, wrongTwo, wrongThree],
}));

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
  { emojis: '🧙‍♂️ 💍 🌋', answer: 'The Lord of the Rings', explanation: 'Cincin sakti harus dihancurkan di gunung berapi dalam The Lord of the Rings.' },
  { emojis: '🦇 🏙️ 🤡', answer: 'The Dark Knight', explanation: 'Batman, Gotham, dan Joker menjadi petunjuk The Dark Knight.' },
  { emojis: '🌌 🚀 💤', answer: 'Inception', explanation: 'Mimpi berlapis dan perjalanan ke alam bawah sadar adalah inti Inception.' },
  { emojis: '💊 🕶️ 🐇', answer: 'The Matrix', explanation: 'Pil merah, kacamata hitam, dan kelinci putih mengarah ke The Matrix.' },
  { emojis: '🤖 🧹 🌍', answer: 'WALL-E', explanation: 'Robot kecil membersihkan Bumi yang dipenuhi sampah dalam WALL-E.' },
  { emojis: '🏎️ ⚡ 🏁', answer: 'Cars', explanation: 'Lightning McQueen adalah mobil balap dalam Cars.' },
  { emojis: '🐼 🥋 🐉', answer: 'Kung Fu Panda', explanation: 'Panda yang belajar kung fu adalah Po dalam Kung Fu Panda.' },
  { emojis: '🍝 🐀 👨‍🍳', answer: 'Ratatouille', explanation: 'Tikus yang bermimpi menjadi koki adalah premis Ratatouille.' },
  { emojis: '👸 🐸 🎷', answer: 'The Princess and the Frog', explanation: 'Putri, katak, dan musik jazz membawa ke The Princess and the Frog.' },
  { emojis: '🧜‍♀️ 🦀 🌊', answer: 'The Little Mermaid', explanation: 'Ariel, Sebastian, dan kehidupan bawah laut adalah The Little Mermaid.' },
  { emojis: '🧞‍♂️ 🕌 🪔', answer: 'Aladdin', explanation: 'Lampu ajaib dan jin mengabulkan permintaan dalam Aladdin.' },
  { emojis: '🧑‍🚀 🌕 📻', answer: 'Apollo 13', explanation: 'Misi luar angkasa yang bermasalah menjadi kisah Apollo 13.' },
  { emojis: '🦸‍♀️ 🛡️ ⚔️', answer: 'Wonder Woman', explanation: 'Pahlawan Amazon dengan perisai dan pedang adalah Wonder Woman.' },
  { emojis: '🐕 🛷 ❄️', answer: 'Balto', explanation: 'Anjing penarik kereta salju membantu mengirim obat dalam Balto.' },
  { emojis: '🍫 🏭 🎩', answer: 'Charlie and the Chocolate Factory', explanation: 'Pabrik cokelat ajaib milik Willy Wonka menjadi latar film ini.' },
  { emojis: '🎤 🥊 🎶', answer: '8 Mile', explanation: 'Seorang rapper muda berjuang membuktikan diri di Detroit dalam 8 Mile.' },
  { emojis: '👻 🚫 🚙', answer: 'Ghostbusters', explanation: 'Tim pemburu hantu dengan mobil Ecto-1 adalah Ghostbusters.' },
  { emojis: '🦍 🏙️ 🛩️', answer: 'King Kong', explanation: 'Gorila raksasa yang dibawa ke kota adalah King Kong.' },
  { emojis: '🐅 🚢 🌊', answer: 'Life of Pi', explanation: 'Seorang pemuda terombang-ambing di laut bersama seekor harimau dalam Life of Pi.' },
  { emojis: '🐢 🥷 🍕', answer: 'Teenage Mutant Ninja Turtles', explanation: 'Kura-kura ninja yang menyukai pizza adalah Teenage Mutant Ninja Turtles.' },
  { emojis: '👨‍👩‍👧‍👦 🦸‍♂️ 🏠', answer: 'The Incredibles', explanation: 'Keluarga superhero berusaha hidup normal dalam The Incredibles.' },
  { emojis: '🚂 🎄 🧒', answer: 'The Polar Express', explanation: 'Kereta ajaib membawa seorang anak ke Kutub Utara dalam The Polar Express.' },
  { emojis: '🦊 🐔 🕵️', answer: 'Fantastic Mr. Fox', explanation: 'Rubah cerdik merencanakan pencurian makanan dalam Fantastic Mr. Fox.' },
  { emojis: '🎭 🔪 🚿', answer: 'Psycho', explanation: 'Adegan kamar mandi ikonis menjadi petunjuk film Psycho.' },
  { emojis: '🕵️‍♂️ 🦌 🧠', answer: 'The Silence of the Lambs', explanation: 'Agen FBI dan pembunuh Hannibal Lecter mengarah ke The Silence of the Lambs.' },
  { emojis: '🦢 🩰 🪞', answer: 'Black Swan', explanation: 'Dunia balet dan persaingan peran utama adalah inti Black Swan.' },
  { emojis: '🎸 🧑‍🏫 🎤', answer: 'School of Rock', explanation: 'Guru pengganti membentuk band rock bersama murid-muridnya.' },
  { emojis: '🧛‍♂️ 🌲 🌙', answer: 'Twilight', explanation: 'Romansa antara manusia dan vampir menjadi cerita Twilight.' },
  { emojis: '🍔 🍟 🎓', answer: 'Superbad', explanation: 'Dua sahabat menghadapi malam kacau sebelum lulus SMA dalam Superbad.' },
  { emojis: '👨‍👩‍👧‍👧 🚐 🌞', answer: 'Little Miss Sunshine', explanation: 'Satu keluarga melakukan perjalanan darat untuk kontes kecantikan dalam Little Miss Sunshine.' },
  { emojis: '🧑‍🚀 🥔 🔴', answer: 'The Martian', explanation: 'Astronaut yang terdampar menanam kentang di Mars dalam The Martian.' },
  { emojis: '🧑‍🚀 🛰️ 🌎', answer: 'Gravity', explanation: 'Astronaut berusaha bertahan hidup setelah kecelakaan di orbit dalam Gravity.' },
  { emojis: '🚗 💣 🏜️', answer: 'Mad Max: Fury Road', explanation: 'Kejar-kejaran kendaraan di gurun menjadi ciri Mad Max: Fury Road.' },
  { emojis: '👨‍🚀 ☄️ 💥', answer: 'Armageddon', explanation: 'Tim pengebor dikirim untuk menghancurkan asteroid dalam Armageddon.' },
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
  { answer: 'SPEED', hint: 'Bus kota tidak boleh melambat di bawah batas tertentu.', year: 1994 },
  { answer: 'VENOM', hint: 'Jurnalis berbagi tubuh dengan symbiote alien.', year: 2018 },
  { answer: 'HITCH', hint: 'Konsultan kencan membantu klien memenangkan hati pujaannya.', year: 2005 },
  { answer: 'SELMA', hint: 'Perjalanan bersejarah gerakan hak sipil di Alabama.', year: 2014 },
  { answer: 'HEIST', hint: 'Pencurian besar menjadi pusat thriller ini.', year: 2001 },
  { answer: 'DREDD', hint: 'Hakim jalanan futuristik menegakkan hukum di Mega-City One.', year: 2012 },
  { answer: 'COBRA', hint: 'Polisi tangguh melindungi saksi dari kelompok kriminal.', year: 1986 },
  { answer: 'PANIC', hint: 'Pembunuh bayaran mempertimbangkan untuk meninggalkan pekerjaannya.', year: 2000 },
  { answer: 'AMOUR', hint: 'Pasangan lansia menghadapi masa tua dan penyakit bersama.', year: 2012 },
  { answer: 'MARTY', hint: 'Drama romantis klasik tentang seorang bujangan pemalu.', year: 1955 },
  { answer: 'MIMIC', hint: 'Serangga hasil rekayasa berubah menjadi ancaman bawah tanah.', year: 1997 },
  { answer: 'FOCUS', hint: 'Penipu ulung mengajari seorang perempuan seni mengelabui orang.', year: 2015 },
  { answer: 'SHINE', hint: 'Perjalanan pianis David Helfgott menghadapi tekanan dan kesehatan mental.', year: 1996 },
  { answer: 'HOLES', hint: 'Remaja dihukum menggali lubang di kamp gurun.', year: 2003 },
  { answer: 'ALOHA', hint: 'Kontraktor militer kembali ke Hawaii dan bertemu masa lalunya.', year: 2015 },
  { answer: 'BABEL', hint: 'Beberapa kisah keluarga di berbagai negara saling terhubung.', year: 2006 },
  { answer: 'TAKEN', hint: 'Mantan agen menggunakan keahliannya untuk menyelamatkan putrinya.', year: 2008 },
  { answer: 'CAROL', hint: 'Romansa dua perempuan berlatar New York pada 1950-an.', year: 2015 },
  { answer: 'ANNIE', hint: 'Anak yatim berambut merah menemukan keluarga baru.', year: 1982 },
  { answer: 'TROLL', hint: 'Makhluk kecil dan sihir menjadi bagian dari film fantasi ini.', year: 1986 },
  { answer: 'SHAFT', hint: 'Detektif swasta Harlem menyelidiki kasus kriminal.', year: 1971 },
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

  const pages = await Promise.all(Array.from({ length: 5 }, async (_, index) => {
    const url = new URL('https://api.themoviedb.org/3/trending/movie/day');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('language', 'en-US');
    url.searchParams.set('page', String(index + 1));
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error('Data film dari TMDB gagal dimuat.');
    const payload = await response.json();
    return payload.results || [];
  }));
  const movies = [...new Map(pages.flat()
    .filter((movie) => movie.title && movie.poster_path && !movie.adult)
    .map((movie) => [movie.id, movie])).values()]
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

async function selectRotatingItems(items, seed, count, idForItem, rotateItems) {
  const ordered = seededShuffle(items, seed);
  const ids = ordered.map(idForItem);
  const selectedIds = rotateItems ? await rotateItems(ids, count) : ids.slice(0, count);
  const byId = new Map(ordered.map((item, index) => [ids[index], item]));
  const selected = selectedIds.map((id) => byId.get(id));
  if (selected.length !== count || selected.some((item) => !item)) {
    throw new Error('Rotasi soal menghasilkan pilihan yang tidak valid.');
  }
  return selected;
}

async function buildTrivia(seed, count, rotateItems) {
  const bank = [...TRIVIA_BANK, ...EXTRA_TRIVIA];
  const items = await selectRotatingItems(
    bank,
    seed,
    count,
    (item) => `trivia:${hashString(item.prompt)}`,
    rotateItems,
  );
  return items.map((item, index) => ({
    rotationId: `trivia:${hashString(item.prompt)}`,
    prompt: item.prompt,
    category: item.category,
    choices: seededShuffle(item.choices, `${seed}:${index}:${item.prompt}`),
    answer: item.answer,
    explanation: item.explanation,
  }));
}

async function buildEmoji(seed, count, rotateItems) {
  const items = await selectRotatingItems(
    EMOJI_BANK,
    seed,
    count,
    (item) => `emoji:${hashString(item.answer)}`,
    rotateItems,
  );
  return items.map((item) => ({
    rotationId: `emoji:${hashString(item.answer)}`,
    prompt: item.emojis,
    answer: item.answer,
    explanation: item.explanation,
  }));
}

async function buildWordle(seed, rotateItems) {
  const [item] = await selectRotatingItems(
    WORDLE_TITLES,
    seed,
    1,
    (entry) => `wordle:${entry.answer}`,
    rotateItems,
  );
  return [{
    rotationId: `wordle:${item.answer}`,
    answer: item.answer,
    explanation: `${item.hint} (rilis ${item.year}).`,
  }];
}

export async function buildChallenge(gameKey, mode, seed, rotateItems) {
  const count = GAME_MODES[gameKey][mode].questions;
  if (gameKey === 'trivia') return buildTrivia(seed, count, rotateItems);
  if (gameKey === 'emoji') return buildEmoji(seed, count, rotateItems);
  if (gameKey === 'movie-wordle') return buildWordle(seed, rotateItems);

  const movies = await getTrendingMovies();
  const ordered = seededShuffle(movies, seed);

  if (gameKey === 'guess-movie') {
    const selected = await selectRotatingItems(
      ordered,
      seed,
      count,
      (movie) => `movie:${movie.id}`,
      rotateItems,
    );
    return selected.map((movie) => ({
      rotationId: `movie:${movie.id}`,
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
    const candidates = [];
    for (let leftIndex = 0; leftIndex < ordered.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < ordered.length; rightIndex += 1) {
        const left = ordered[leftIndex];
        const right = ordered[rightIndex];
        for (const metric of ['popularity', 'rating']) {
          candidates.push({
            id: `higher:${metric}:${Math.min(left.id, right.id)}:${Math.max(left.id, right.id)}`,
            left,
            right,
            metric,
          });
        }
      }
    }
    const selected = await selectRotatingItems(candidates, seed, count, (item) => item.id, rotateItems);
    return selected.map(({ id, left, right, metric }) => ({
      rotationId: id,
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
      metric,
    }));
  }

  throw new Error('Game tidak tersedia.');
}

export function getDailyChallengeDate() {
  return new Date().toISOString().slice(0, 10);
}
