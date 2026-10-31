const TMDB_API_BASE = 'https://api.themoviedb.org/3';
const OVERVIEW_MIN_LENGTH = 120;
const ALLOWED_ENDPOINTS = new Set([
  '/genre/movie/list',
  '/trending/movie/day',
  '/search/movie',
  '/discover/movie',
]);
const ALLOWED_PARAMS = new Set([
  'language',
  'page',
  'query',
  'include_adult',
  'sort_by',
  'with_genres',
  'primary_release_year',
  'vote_count.gte',
]);
const ALLOWED_SORTS = new Set([
  'popularity.desc',
  'vote_average.desc',
  'primary_release_date.desc',
]);

function isAllowedEndpoint(endpoint) {
  return ALLOWED_ENDPOINTS.has(endpoint) || /^\/movie\/[1-9]\d*$/.test(endpoint);
}

function validateParams(query) {
  for (const [name, value] of Object.entries(query)) {
    if (name === 'endpoint') continue;
    if (!ALLOWED_PARAMS.has(name) || typeof value !== 'string') {
      return 'Parameter TMDB tidak valid.';
    }

    if (name === 'language' && value !== 'id-ID') {
      return 'Bahasa yang diminta tidak didukung.';
    }
    if (name === 'page' && (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 500)) {
      return 'Nomor halaman tidak valid.';
    }
    if (name === 'query' && (!value.trim() || value.length > 200)) {
      return 'Kata kunci pencarian tidak valid.';
    }
    if (name === 'include_adult' && value !== 'false') {
      return 'Parameter include_adult tidak valid.';
    }
    if (name === 'sort_by' && !ALLOWED_SORTS.has(value)) {
      return 'Urutan film tidak valid.';
    }
    if (name === 'with_genres' && !/^\d+(,\d+)*$/.test(value)) {
      return 'Genre yang diminta tidak valid.';
    }
    if (name === 'primary_release_year' && !/^\d{4}$/.test(value)) {
      return 'Tahun rilis tidak valid.';
    }
    if (name === 'vote_count.gte' && (!/^\d+$/.test(value) || Number(value) > 1000000)) {
      return 'Batas jumlah vote tidak valid.';
    }
  }

  if (query.endpoint === '/search/movie' && !query.query) {
    return 'Kata kunci pencarian wajib diisi.';
  }

  return '';
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Metode permintaan tidak didukung.' });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'API TMDB belum dikonfigurasi di server.' });
  }

  const query = req.query || {};
  const endpoint = query.endpoint;
  if (typeof endpoint !== 'string' || !isAllowedEndpoint(endpoint)) {
    return res.status(400).json({ error: 'Endpoint TMDB tidak diizinkan.' });
  }

  const validationError = validateParams(query);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const url = new URL(`${TMDB_API_BASE}${endpoint}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('language', 'id-ID');
  for (const [name, value] of Object.entries(query)) {
    if (name !== 'endpoint' && name !== 'language') {
      url.searchParams.set(name, value);
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const upstream = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    if (!upstream.ok) {
      const body = await upstream.text();
      res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
      return res.status(upstream.status).send(body);
    }

    const data = await upstream.json();
    const localizedOverview = typeof data.overview === 'string' ? data.overview.trim() : '';
    if (/^\/movie\/[1-9]\d*$/.test(endpoint) && localizedOverview.length < OVERVIEW_MIN_LENGTH) {
      const englishUrl = new URL(url);
      englishUrl.searchParams.set('language', 'en-US');

      try {
        const englishResponse = await fetch(englishUrl, {
          headers: { accept: 'application/json' },
          signal: controller.signal,
        });
        if (englishResponse.ok) {
          const englishData = await englishResponse.json();
          const englishOverview = typeof englishData.overview === 'string'
            ? englishData.overview.trim()
            : '';
          if (englishOverview.length > localizedOverview.length) {
            data.overview = englishOverview;
          }
        }
      } catch (fallbackError) {
        console.error('Failed to load English TMDB overview:', fallbackError);
      }
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(upstream.status).json(data);
  } catch (error) {
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Permintaan ke TMDB timeout. Coba lagi.' });
    }
    return res.status(502).json({ error: 'Tidak bisa terhubung ke TMDB.' });
  } finally {
    clearTimeout(timeout);
  }
};
