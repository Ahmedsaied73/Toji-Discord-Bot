# TojiBot - Discord Bot

A Discord bot that role-plays as Toji Fushiguro from Jujutsu Kaisen. The bot uses LangChain, OpenAI, and Supabase to provide an interactive character experience.

## Features

- Responds to messages starting with `!toji`
- Supports slash commands (`/chat`, `/help`)
- Responds to direct messages (DMs)
- Responds to simple greetings like "hello"
- Maintains conversation history per user using Supabase
- Fetches relevant character facts to enhance responses
- Uses LangChain's ConversationChain and OpenAI for natural dialogue
- Stays in character as Toji Fushiguro

## Prerequisites

- Node.js (v16 or higher)
- Discord Bot Token
- OpenAI API Key
- Supabase Project with the following tables:
  - `character_facts` - Stores facts about Toji Fushiguro
  - `gojo_memory` - Stores conversation history per user

## Setup

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your credentials:
   ```
   cp .env.example .env
   ```
4. Edit the `.env` file with your actual API keys and tokens
5. **Important:** Configure your Discord bot in the Discord Developer Portal to enable the required intents. See [DISCORD_SETUP.md](DISCORD_SETUP.md) for detailed instructions.

## Database Schema

### character_facts Table
```sql
create table character_facts (
  id uuid default uuid_generate_v4() primary key,
  fact_text text not null,
  created_at timestamp with time zone default now()
);
```

### gojo_memory Table
```sql
create table gojo_memory (
  user_id text primary key,
  memory_data jsonb not null,
  updated_at timestamp with time zone default now()
);
```
## Running the Bot

```bash
# Verify Discord connection and intents (recommended before first run)
npm run verify

# Start the bot
npm start

# Start with automatic restart on file changes (development)
npm run dev
```

## Troubleshooting

If you encounter any issues, please refer to the [Troubleshooting Guide](TROUBLESHOOTING.md).

## Usage

There are multiple ways to interact with TojiBot:

### Slash Commands

```
/chat What do you think about Gojo Satoru?
/help - Shows available commands and usage information
```

### Traditional Commands

```
!toji What do you think about Gojo Satoru?
```

### Simple Interactions

```
hello
```

### Direct Messages

You can also send direct messages to the bot, and it will respond to any message without needing a prefix.

The bot will always respond in character as Toji Fushiguro.

## Project Structure

- `app.js` - Main bot application with Discord event handlers
- `supabase.js` - Supabase client setup
- `memory.js` - Functions for loading/saving conversation memory
- `start.js` - Entry point that runs verification before starting the bot
- `verify-discord.js` - Tool to verify Discord connection and intents
- `.env` - Environment variables (not committed to version control)
- `.env.example` - Example environment variables template
- `DISCORD_SETUP.md` - Instructions for setting up Discord bot intents
- `TROUBLESHOOTING.md` - Guide for resolving common issues

## License

ISC