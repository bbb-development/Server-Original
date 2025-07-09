import { createClient } from '@supabase/supabase-js';
import envConfig from './envConfig.js';

// Create Supabase client with service role key for admin operations
const supabase = createClient(envConfig.supabaseUrl, envConfig.supabaseServiceRoleKey);

export default supabase; 