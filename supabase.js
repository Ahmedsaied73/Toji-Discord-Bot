// Supabase client setup for TojiBot

// Import required modules
const { createClient } = require('@supabase/supabase-js');

// Load environment variables if not already loaded
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  require('dotenv').config();
}

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Test the connection
async function testConnection() {
  try {
    const { data, error } = await supabase.from('character_facts').select('count').limit(1);
    if (error) throw error;
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection error:', error.message);
    return false;
  }
}

// Export the Supabase client and helper functions
module.exports = {
  supabase,
  testConnection
};