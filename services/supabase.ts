import { createClient } from '@supabase/supabase-js';

// Replace with environment variables or user input
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
export const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Initialize Supabase only if credentials are available
export const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
            // Desativar o mecanismo de trava que causa o erro 'AbortError: Lock broken'
            // @ts-ignore - A assinatura de LockFunc pode variar entre versões, mas o no-op resolve o travamento
            lock: (name: string, acquireTimeout: number, fn: () => Promise<any>) => fn(),
        }
    })
    : null;

if (!supabase) {
    // Supabase client missing
}

/**
 * Helper to check if Supabase is configured.
 */
export const isSupabaseConfigured = (): boolean => {
    return !!supabase;
};
