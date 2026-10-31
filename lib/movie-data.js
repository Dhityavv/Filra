export function isValidMovieSnapshot(movie, movieId) {
  if (!movie || typeof movie !== 'object' || Array.isArray(movie)) return false;
  const allowedFields = ['id', 'title', 'poster_path', 'release_date', 'vote_average', 'genre_ids'];
  if (Object.keys(movie).length !== allowedFields.length
    || Object.keys(movie).some((field) => !allowedFields.includes(field))) return false;
  if (!Number.isSafeInteger(movie.id) || movie.id !== movieId
    || typeof movie.title !== 'string' || movie.title.length > 300) {
    return false;
  }
  if (movie.poster_path !== null && typeof movie.poster_path !== 'string') return false;
  if (typeof movie.poster_path === 'string' && movie.poster_path.length > 300) return false;
  if (typeof movie.release_date !== 'string' || movie.release_date.length > 20) return false;
  if (typeof movie.vote_average !== 'number' || !Number.isFinite(movie.vote_average)
    || movie.vote_average < 0 || movie.vote_average > 10) return false;
  if (!Array.isArray(movie.genre_ids) || movie.genre_ids.length > 100
    || movie.genre_ids.some((genreId) => !Number.isSafeInteger(genreId) || genreId < 0)) return false;
  return true;
}
