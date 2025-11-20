import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Make __dirname work in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend folder
dotenv.config({ path: join(__dirname, '..', '.env') });

// Read variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // using service role key

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ SUPABASE_URL or SUPABASE_SERVICE_KEY missing");
  throw new Error('Missing Supabase credentials in environment variables');
}

// Create and export client
export const supabase = createClient(supabaseUrl, supabaseKey);
