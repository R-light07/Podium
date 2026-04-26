/**
 * PODIUM — SUPABASE CONFIG
 * -----------------------------------------------------------
 * Preencher estas duas constantes com os valores do seu projecto.
 *
 * COMO OBTER:
 *   1. https://supabase.com/dashboard/project/<seu_projecto>/settings/api
 *   2. Copiar "Project URL" → SUPABASE_URL
 *   3. Copiar "anon / public" key → SUPABASE_ANON_KEY
 *
 * SEGURANÇA:
 *   A anon key é SEGURA no cliente por design. As políticas RLS
 *   (definidas em supabase/schema.sql) garantem que os utilizadores
 *   só conseguem ler notícias publicadas e que apenas administradores
 *   podem criar/editar/eliminar conteúdo.
 *
 *   NUNCA coloque a `service_role` key aqui — essa é apenas para servidor.
 * -----------------------------------------------------------
 */

window.PODIUM_CONFIG = {
  SUPABASE_URL:      'https://oabyrxsqfbcklkgzjdoi.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hYnlyeHNxZmJja2xrZ3pqZG9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMjIxNTEsImV4cCI6MjA5Mjc5ODE1MX0.UroPhOz6hWKFn0tgjIk8g0MxYys7WTaCp00wWvK495s',
  STORAGE_BUCKET:    'noticias-imagens'
};

/**
 * Helper global para obter cliente Supabase inicializado.
 * Chamar depois de carregar o script CDN do @supabase/supabase-js.
 */
window.getSupabaseClient = function () {
  if (!window.supabase) {
    console.error('[Podium] Supabase SDK não carregado. Verifique o <script> CDN.');
    return null;
  }
  if (!window.__supabase_client) {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.PODIUM_CONFIG;
    if (SUPABASE_URL.includes('XXXX') || SUPABASE_ANON_KEY.includes('SUBSTITUIR')) {
      console.warn('[Podium] supabase-config.js ainda não foi configurado — a usar dados mock.');
      return null;
    }
    window.__supabase_client = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        }
      }
    );
  }
  return window.__supabase_client;
};
