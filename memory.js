// Memory management for TojiBot
// Handles loading and saving conversation memory to Supabase

const { BufferMemory } = require('langchain/memory');
const { supabase } = require('./supabase');

/**
 * Load a user's conversation memory from Supabase
 * @param {string} userId - Discord user ID
 * @returns {BufferMemory} - LangChain BufferMemory instance
 */
async function loadMemory(userId) {
  try {
    // Attempt to retrieve existing memory from Supabase
    const { data, error } = await supabase
      .from('gojo_memory')
      .select('memory_data')
      .eq('user_id', userId)
      .single();
    
    // Create a new BufferMemory instance
    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: 'history',
      inputKey: 'input',
    });
    
    // If we found existing memory data, load it into the BufferMemory
    if (data && data.memory_data) {
      // Parse the stored memory data
      const memoryData = data.memory_data;
      
      // If there are stored messages, add them to the memory
      if (memoryData.chatHistory && Array.isArray(memoryData.chatHistory)) {
        // We need to manually restore the chat history
        // This is a simplified approach - in a production app, you might need more robust parsing
        for (let i = 0; i < memoryData.chatHistory.length; i += 2) {
          const humanMessage = memoryData.chatHistory[i];
          const aiMessage = memoryData.chatHistory[i + 1];
          
          if (humanMessage && aiMessage) {
            await memory.saveContext(
              { input: humanMessage.content },
              { output: aiMessage.content }
            );
          }
        }
      }
    }
    
    return memory;
  } catch (error) {
    console.error('Error loading memory:', error);
    // Return a fresh memory instance if there was an error
    return new BufferMemory({
      returnMessages: true,
      memoryKey: 'history',
      inputKey: 'input',
    });
  }
}

/**
 * Save a user's conversation memory to Supabase
 * @param {string} userId - Discord user ID
 * @param {Array} messages - Array of message objects (from InMemoryChatMessageHistory)
 */
async function saveMemory(userId, messages) {
  try {
    // Prepare the memory data for storage
    const memoryData = {
      chatHistory: messages,
    };

    // Upsert the memory data to Supabase
    const { error } = await supabase
      .from('gojo_memory')
      .upsert({
        user_id: userId,
        memory_data: memoryData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error saving memory:', error);
  }
}

module.exports = {
  loadMemory,
  saveMemory,
};