# RateFilm

Website katalog film sederhana dengan data dari TMDB. Bisa mencari film, memfilter, menyimpan watchlist, serta memberi rating dan review pribadi.

Dibuat dengan HTML, CSS, dan JavaScript murni — tanpa build tools dan tanpa backend.

## Fitur

- Katalog film populer dari TMDB
- Pencarian judul (debounced)
- Filter genre dan tahun, urutkan berdasarkan popularitas, rating, atau rilis terbaru
- Halaman detail film: sinopsis, genre, durasi, skor TMDB
- Rating 1–10 dengan review singkat
- Watchlist
- Halaman "Rating kamu" dengan rata-rata rating
- Tema gelap responsif, modal detail, toast, dan skeleton loading

## Menjalankan

1. Daftar API key gratis di [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api).
2. Buka `index.html` di browser, lalu tempel **API Key (v3 auth)** pada layar awal. Read Access Token (v4) juga didukung.
3. Selesai.

Cara lain: isi `js/config.js`:

```js
window.RATEFILM_CONFIG = {
  tmdbApiKey: 'API_KEY_KAMU'
};
```

Key di `js/config.js` dipakai untuk semua pengunjung. Key yang ditempel lewat layar pengaturan hanya tersimpan di browser itu dan menimpa key dari config.

Disarankan menjalankan lewat server lokal agar perilakunya sama seperti saat di-hosting:

```bash
python -m http.server 8080
# atau
npx serve .
```

Lalu buka `http://localhost:8080`.

## Struktur

```
index.html      Markup utama
css/styles.css  Seluruh styling
js/config.js    Konfigurasi API key (opsional)
js/app.js       Logika TMDB, pencarian, filter, rating, watchlist
```

## Penyimpanan data & privasi

Rating, review, watchlist, dan API key disimpan di `localStorage` browser masing-masing pengunjung.

- Data **tidak dibagikan** ke pengunjung atau perangkat lain.
- Data **tidak tersinkron** antar browser/perangkat.
- Menghapus data situs di browser akan menghapus rating dan watchlist.
- Karena tidak ada backend, tidak ada akun pengguna. Login/akun sungguhan memerlukan server dan database.

Catatan keamanan: pada situs statis, API key TMDB dapat dilihat siapa pun yang membuka DevTools. Untuk situs publik berskala besar, gunakan backend proxy agar key tidak terekspos.

## Atribusi

Data film dan gambar disediakan oleh [TMDB](https://www.themoviedb.org/). Produk ini tidak didukung atau disertifikasi oleh TMDB.
