/* global process */
import { createClient } from '@supabase/supabase-js';

// Vercel fournit directement ces variables en production
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('CRITIQUE: SUPABASE_URL ou SUPABASE_KEY manquant !');
    // On ne fait pas de process.exit(1) sur Vercel, on laisse juste l'erreur s'afficher
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export default supabase;