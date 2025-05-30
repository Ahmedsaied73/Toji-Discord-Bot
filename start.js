// Start script for TojiBot
// This script checks the Supabase connection before starting the bot

// Import required modules
const { testConnection } = require('./supabase');
const { verifyDiscordConnection } = require('./verify-discord');

// Main function to start the bot
async function startBot() {
  console.log('Starting TojiBot...');
  
  // Test Supabase connection
  console.log('Testing Supabase connection...');
  const connected = await testConnection();
  
  if (!connected) {
    console.error('Failed to connect to Supabase. Please check your credentials.');
    process.exit(1);
  }
  
  console.log('Supabase connection successful!');
  
  // Verify Discord connection and intents
  console.log('\nVerifying Discord connection and intents...');
  const discordVerified = await verifyDiscordConnection();
  
  if (!discordVerified) {
    console.error('Discord verification failed. Please check the errors above.');
    process.exit(1);
  }
  
  console.log('Discord verification successful!');
  
  // Start the bot
  console.log('\nStarting Discord bot...');
  require('./app');
}

// Start the bot
startBot().catch(error => {
  console.error('Error starting bot:', error);
  process.exit(1);
});