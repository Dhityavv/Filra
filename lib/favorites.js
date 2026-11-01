export function isFavoriteTableMissing(error) {
  return (error?.code === 'PGRST205' || error?.code === '42P01')
    && error.message?.includes('favorite_movies');
}

export const FAVORITES_MIGRATION_MESSAGE = 'Fitur favorit belum aktif. Terapkan migrasi supabase/migrations/20261101160000_add_favorite_movies.sql di Supabase.';
