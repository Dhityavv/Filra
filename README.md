# Filra - Film Rating

Filra (Film Rating) adalah website katalog film dengan data dari TMDB. Pengunjung bisa mencari film, memfilter katalog, menyimpan watchlist, serta memberi rating dan review pribadi tanpa login.

## Fitur

- Katalog film populer dari TMDB
- Pencarian judul, filter genre dan tahun, serta pengurutan film
- Halaman detail film: sinopsis, genre, durasi, dan skor TMDB
- Rating 1–10 dengan review singkat
- Watchlist pribadi
- Tema gelap dan terang yang bisa diganti, modal detail, toast, dan skeleton loading

## Menyiapkan TMDB di Vercel

Pengunjung tidak perlu membuat akun TMDB atau memasukkan API key. Atur key satu kali di server:

1. Buat **API Key (v3 auth)** di [pengaturan API TMDB](https://www.themoviedb.org/settings/api).
2. Di Vercel, buka **Project Settings → Environment Variables** dan tambahkan `TMDB_API_KEY` dengan nilai API key tersebut.
3. Pilih environment yang digunakan (**Production**, dan **Preview/Development** bila diperlukan), lalu deploy ulang.

Function di `api/tmdb.js` menggunakan key itu untuk mengambil data TMDB. Key tidak dikirim ke browser dan jangan dimasukkan ke file frontend atau Git.

Sinopsis ditampilkan dalam bahasa Indonesia bila tersedia. Jika kosong atau terlalu pendek, Filra memakai sinopsis bahasa Inggris dari TMDB bila tersedia.

## Menjalankan lokal

Vercel CLI diperlukan agar function `/api/tmdb` tersedia saat development:

```bash
npm install --global vercel
vercel login
vercel link
vercel env pull .env.local
vercel dev
```

Pastikan `TMDB_API_KEY` tersedia untuk environment **Development**. File `.env.local` dan konfigurasi lokal Vercel diabaikan oleh Git.

## Struktur

```
index.html      Markup utama
css/styles.css  Seluruh styling
js/app.js       Logika katalog, pencarian, filter, rating, dan watchlist
api/tmdb.js     Proxy server-side ke TMDB
```

## Penyimpanan data & privasi

Rating, review, dan watchlist disimpan di `localStorage` browser masing-masing pengunjung.

- Data tidak dikirim atau dibagikan ke pengunjung lain.
- Data tidak tersinkron antarbrowser atau perangkat.
- Orang yang memakai profil browser yang sama akan melihat data lokal yang sama.
- Pilihan tema juga tersimpan lokal di browser.
- Menghapus data situs di browser akan menghapus rating dan watchlist.
- Tidak ada login atau akun pengguna.

## Atribusi

Data film dan gambar disediakan oleh [TMDB](https://www.themoviedb.org/). Produk ini tidak didukung atau disertifikasi oleh TMDB.
