// Discord Bot Intent Verification Script
// This script checks if your bot can connect to Discord with the current intents configuration

// Load environment variables
require('dotenv').config();

// Import Discord.js
const { Client, GatewayIntentBits, Events } = require('discord.js');

// Create a test client with minimal intents first
const testBasicClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

// Then create a test client with all the intents the bot needs
const testFullClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
  ],
  partials: ['CHANNEL'], // Required for DM support
});

// Function to test connection with basic intents
async function testBasicConnection() {
  return new Promise((resolve, reject) => {
    // Set a timeout in case connection hangs
    const timeout = setTimeout(() => {
      testBasicClient.destroy();
      reject(new Error('Connection timed out'));
    }, 10000);

    // Listen for ready event
    testBasicClient.once(Events.ClientReady, () => {
      clearTimeout(timeout);
      console.log('✅ Basic connection successful!');
      testBasicClient.destroy();
      resolve(true);
    });

    // Listen for error
    testBasicClient.on('error', (error) => {
      clearTimeout(timeout);
      console.error('❌ Basic connection failed:', error.message);
      testBasicClient.destroy();
      reject(error);
    });

    // Attempt to login
    testBasicClient.login(process.env.DISCORD_TOKEN).catch(error => {
      clearTimeout(timeout);
      console.error('❌ Basic login failed:', error.message);
      reject(error);
    });
  });
}

// Function to test connection with all required intents
async function testFullConnection() {
  return new Promise((resolve, reject) => {
    // Set a timeout in case connection hangs
    const timeout = setTimeout(() => {
      testFullClient.destroy();
      reject(new Error('Connection timed out'));
    }, 10000);

    // Listen for ready event
    testFullClient.once(Events.ClientReady, () => {
      clearTimeout(timeout);
      console.log('✅ Full connection with all intents successful!');
      testFullClient.destroy();
      resolve(true);
    });

    // Listen for error
    testFullClient.on('error', (error) => {
      clearTimeout(timeout);
      console.error('❌ Full connection failed:', error.message);
      testFullClient.destroy();
      reject(error);
    });

    // Attempt to login
    testFullClient.login(process.env.DISCORD_TOKEN).catch(error => {
      clearTimeout(timeout);
      console.error('❌ Full login failed:', error.message);
      reject(error);
    });
  });
}

// Main verification function
async function verifyDiscordConnection() {
  console.log('🔍 Verifying Discord bot connection...');
  console.log('🔑 Using token:', process.env.DISCORD_TOKEN ? '***' + process.env.DISCORD_TOKEN.slice(-5) : 'Not found');
  
  try {
    // First test with basic intents
    await testBasicConnection();
    
    // Then test with all required intents
    await testFullConnection();
    
    console.log('\n✅✅✅ VERIFICATION SUCCESSFUL! ✅✅✅');
    console.log('Your bot is properly configured and can connect to Discord with all required intents.');
    return true;
  } catch (error) {
    console.error('\n❌❌❌ VERIFICATION FAILED! ❌❌❌');
    
    if (error.message.includes('disallowed intents')) {
      console.error('\n🔴 INTENT PERMISSION ERROR:');
      console.error('Your bot is trying to use intents that are not enabled in the Discord Developer Portal.');
      console.error('\n📋 SOLUTION:');
      console.error('1. Go to https://discord.com/developers/applications');
      console.error('2. Select your bot application');
      console.error('3. Go to the "Bot" tab');
      console.error('4. Scroll down to "Privileged Gateway Intents"');
      console.error('5. Enable the following intents:');
      console.error('   - MESSAGE CONTENT INTENT');
      console.error('   - SERVER MEMBERS INTENT');
      console.error('6. Save changes and try again');
      console.error('\nFor detailed instructions, see DISCORD_SETUP.md');
    } else if (error.message.includes('token')) {
      console.error('\n🔴 TOKEN ERROR:');
      console.error('Your Discord bot token is invalid or not properly set in the .env file.');
      console.error('\n📋 SOLUTION:');
      console.error('1. Check your .env file and ensure DISCORD_TOKEN is set correctly');
      console.error('2. Verify the token in the Discord Developer Portal');
      console.error('3. Try regenerating the token if necessary');
    } else {
      console.error('\n🔴 UNKNOWN ERROR:');
      console.error(error);
    }
    
    return false;
  }
}

// Run the verification if this script is executed directly
if (require.main === module) {
  verifyDiscordConnection()
    .then(success => {
      if (!success) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unexpected error during verification:', error);
      process.exit(1);
    });
}

module.exports = { verifyDiscordConnection };