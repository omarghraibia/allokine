/* global process */
import { createClient } from '@supabase/supabase-js';
import '../config/loadEnv.js';

// Le code va lire les variables secrètes depuis l'environnement Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL ou SUPABASE_KEY manquant dans backend/.env');
    process.exit(1);
}

// Instance serveur sans persistance de session locale.
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

export default supabase;