/* global process */
import { createClient } from '@supabase/supabase-js';

// Vercel fournit directement ces variables en production
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey =
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    '';

const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);

if (!hasSupabaseConfig) {
    console.error(
        'CRITIQUE: configuration Supabase manquante. Variables attendues: SUPABASE_URL + SUPABASE_KEY, ou SUPABASE_SERVICE_ROLE_KEY, ou VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.'
    );
}

const buildMissingConfigError = () => {
    const error = new Error('Configuration Supabase manquante');
    error.statusCode = 500;
    error.expose = true;
    return error;
};

const baseClient = hasSupabaseConfig
    ? createClient(supabaseUrl, supabaseKey, {
          auth: {
              autoRefreshToken: false,
              persistSession: false
          }
      })
    : null;

const supabase = new Proxy(
    {},
    {
        get(_target, property) {
            if (!baseClient) {
                throw buildMissingConfigError();
            }

            const value = Reflect.get(baseClient, property);
            return typeof value === 'function' ? value.bind(baseClient) : value;
        }
    }
);

export default supabase;
