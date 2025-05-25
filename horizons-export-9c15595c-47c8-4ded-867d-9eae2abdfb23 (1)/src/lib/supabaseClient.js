import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://goicwznzdlkztukfbcxt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdvaWN3em56ZGxrenR1a2ZiY3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NjM0MTcsImV4cCI6MjA2MzAzOTQxN30.-BZtSwbEeq5SS9O9LV0hUPYzyRR5-C3mEw8p9EzBgxI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);