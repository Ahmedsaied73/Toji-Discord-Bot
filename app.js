// TojiBot - A Discord bot that role-plays as Toji Fushiguro from Jujutsu Kaisen

// Load environment variables
require('dotenv').config();

// Import required modules
const { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder, Collection } = require('discord.js');
const { loadMemory, saveMemory } = require('./memory');
const { supabase } = require('./supabase');
const { ChatGroq } = require("@langchain/groq");
const { InMemoryChatMessageHistory } = require("@langchain/core/chat_history");

// Initialize Groq model
const groqModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: 'llama3-70b-8192',
});

// Create a new Discord client with necessary intents
// IMPORTANT: MessageContent and DirectMessages are privileged intents that MUST be enabled in the Discord Developer Portal
// See DISCORD_SETUP.md for instructions on enabling these intents
// https://discord.com/developers/applications
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // This requires enabling in Discord Developer Portal!
    GatewayIntentBits.DirectMessages, // For handling DMs
    GatewayIntentBits.GuildMembers, // Optional but good to have (SERVER MEMBERS INTENT)
  ],
  partials: ['CHANNEL'], // Required for DM support
});

// Function to fetch relevant character facts from Supabase
async function getRelevantFacts(message) {
  try {
    // Extract keywords from the message
    const keywords = message.toLowerCase().split(/\s+/);
    
    // Filter out common words (simple approach)
    const filteredKeywords = keywords.filter(word => 
      word.length > 3 && !['what', 'when', 'where', 'which', 'this', 'that', 'with', 'from'].includes(word)
    );
    
    // Query Supabase for facts containing any of these keywords
    let query = supabase
      .from('character_facts')
      .select('fact_text');

    if (filteredKeywords.length > 0) {
      query = query.or(filteredKeywords.map(keyword => `fact_text.ilike.%${keyword}%`).join(','));
    }

    let { data: facts, error } = await query;
    
    if (error) {
      console.error('Error fetching facts:', error);
      return [];
    }
    
    // Limit to 3 most relevant facts to avoid context overload
    return facts.slice(0, 3).map(fact => fact.fact_text);
  } catch (error) {
    console.error('Error in getRelevantFacts:', error);
    return [];
  }
}

// Create a message history store for each user
const messageHistories = new Map();

// Function to get or create a message history for a user
async function getMessageHistory(userId) {
  if (!messageHistories.has(userId)) {
    const memory = await loadMemory(userId);
    const chatHistory = new InMemoryChatMessageHistory();
    if (memory && Array.isArray(memory.chatHistory)) {
      for (const msg of memory.chatHistory) {
        if (msg.type === 'human') {
          chatHistory.addUserMessage(msg.data.content);
        } else if (msg.type === 'ai') {
          chatHistory.addAIChatMessage(msg.data.content);
        }
      }
    }
    messageHistories.set(userId, chatHistory);
  }
  return messageHistories.get(userId);
}

// Collection to store slash commands
client.commands = new Collection();

// Define slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Chat with Toji Fushiguro')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('What do you want to say to Toji?')
        .setRequired(true)),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get information about how to use TojiBot'),
];

// Register commands when the bot is ready
client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Logged in as ${c.user.tag}`);
  
  try {
    // Register slash commands with Discord API
    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
    console.log('Started refreshing application (/) commands.');
    
    await rest.put(
      Routes.applicationCommands(c.user.id),
      { body: commands },
    );
    
    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error('Error refreshing slash commands:', error);
  }
});

// Function to generate a response using the conversation chain
async function generateResponse(userMessage, userId) {
  try {
    // Get relevant facts about Toji based on the user's message
    const relevantFacts = await getRelevantFacts(userMessage);
    const factsContext = relevantFacts.join('\n');

    // Get message history for the user
    const messageHistory = await getMessageHistory(userId);
    const historyContext = messageHistory.messages
      .map(msg => {
        if (!msg.data || !msg.data.content) return null;
        return msg.type === 'human'
          ? `User: ${msg.data.content}`
          : `Toji: ${msg.data.content}`;
      })
      .filter(Boolean)
      .join('\n');

    // Build the prompt for the LLM
    const prompt = `Facts: ${factsContext}\nHistory: ${historyContext}\nInput: ${userMessage}\nToji:`;

    // Call the Groq model directly
    const response = await groqModel.invoke(prompt);
    let output = response;
    if (typeof response === 'object' && response.content) {
      output = response.content;
    }

    // Save the new message to memory
    await messageHistory.addUserMessage(userMessage);
    await messageHistory.addAIChatMessage(output);
    await saveMemory(userId, messageHistory.messages);
    return output;
  } catch (error) {
    console.error('Error generating response:', error);
    return "Something's interfering with my work. I'll be back.";
  }
}

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand()) return;
  
  try {
    const { commandName, options, user } = interaction;
    
    // Defer reply to give us time to generate a response
    await interaction.deferReply();
    
    if (commandName === 'chat') {
      const userMessage = options.getString('message');
      
      if (!userMessage || userMessage.trim() === '') {
        await interaction.editReply("What do you want? I don't have time for silence.");
        return;
      }
      
      try {
        const response = await generateResponse(userMessage, user.id);
        await interaction.editReply(String(response || "I couldn't generate a response right now."));
      } catch (error) {
        console.error('Error handling chat command:', error);
        await interaction.followUp("Something's interfering with my work. I'll be back.");
      }
    }
    else if (commandName === 'help') {
      await interaction.editReply({
        content: "**TojiBot Commands**\n\n" +
                 "`/chat [message]` - Chat with Toji Fushiguro\n" +
                 "`/help` - Show this help message\n\n" +
                 "You can also chat with Toji by:\n" +
                 "- Using `!toji [message]` in any channel\n" +
                 "- Simply saying `hello` to start a conversation\n" +
                 "- Sending a direct message to the bot"
      });
    }
  } catch (error) {
    console.error('Error handling slash command:', error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply("Something's interfering with my work. I'll be back.");
    } else {
      await interaction.reply({ content: "Something's interfering with my work. I'll be back.", ephemeral: true });
    }
  }
});

// Event: Message received (for backward compatibility and DMs)
client.on(Events.MessageCreate, async (message) => {
  // Ignore messages from bots (including itself)
  if (message.author.bot) return;
  
  // Handle messages in both server channels and DMs
  try {
    // Simple 'hello' response (case insensitive)
    if (message.content.toLowerCase() === 'hello') {
      message.reply("Yo, it's Toji. What's up?");
      return;
    }
    
    // Check if the message starts with !toji or is a DM
    if (message.content.startsWith('!toji') || message.channel.type === 'DM') {
      // Extract the actual message
      let userMessage = message.content;
      if (message.content.startsWith('!toji')) {
        userMessage = message.content.substring('!toji'.length).trim();
      }
      
      if (!userMessage) {
        message.reply("What do you want? I don't have time for silence.");
        return;
      }
      
      // Show typing indicator
      message.channel.sendTyping();
      
      const response = await generateResponse(userMessage, message.author.id);
      message.reply(response);
    }
  } catch (error) {
    console.error('Error processing message:', error);
    message.reply("Something's interfering with my work. I'll be back.");
  }
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

console.log('TojiBot is starting up...');