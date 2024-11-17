const { createClient } = import('@supabase/supabase-js');

// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = 'https://yddzgledjhsvpriyrjkf.supabase.co'; // Your Supabase project URL
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkZHpnbGVkamhzdnByaXlyamtmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE3ODM3ODYsImV4cCI6MjA0NzM1OTc4Nn0.HdfYsCeq75colO5To6o_xtHD6uRGTz3VyJCv-VCstFc'; // Your Supabase public anon key

// Create the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase; // Export using CommonJS syntax
