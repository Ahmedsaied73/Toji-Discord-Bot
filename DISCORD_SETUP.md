# Discord Bot Setup Guide

## Enabling Privileged Intents

The TojiBot requires several privileged intents to function properly:

- `MESSAGE CONTENT` - Allows the bot to read message content
- `SERVER MEMBERS` - Allows the bot to access server member information
- `DIRECT MESSAGES` - Allows the bot to receive and respond to DMs

Follow these steps to enable the required intents:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your bot application
3. Navigate to the "Bot" tab in the left sidebar
4. Scroll down to the "Privileged Gateway Intents" section
5. Enable the following intents by toggling their switches:
   - MESSAGE CONTENT INTENT
   - SERVER MEMBERS INTENT
6. Click "Save Changes" at the bottom of the page

![Discord Privileged Intents](https://i.imgur.com/HlOZPDq.png)

## Updating the Bot Code

After enabling the intents in the Discord Developer Portal, you need to update the `app.js` file to use all the required intents:

```javascript
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Requires enabling in Discord Developer Portal
    GatewayIntentBits.DirectMessages, // For handling DMs
    GatewayIntentBits.GuildMembers, // Optional but good to have
  ],
  partials: ['CHANNEL'], // Required for DM support
});
```

## Inviting the Bot to Your Server

1. In the Discord Developer Portal, go to the "OAuth2" tab and select "URL Generator"
2. Under "Scopes", select "bot" and "applications.commands" (required for slash commands)
3. Under "Bot Permissions", select the permissions your bot needs (at minimum: "Read Messages/View Channels", "Send Messages", and "Read Message History")
4. Copy the generated URL and open it in your browser
5. Select the server you want to add the bot to and follow the prompts

## Testing the Bot

After inviting the bot to your server and starting it with `npm start`, test it using the following methods:

### Slash Commands

1. Use the `/chat` command to talk with Toji:
```
/chat What's your opinion on Gojo?
```

2. Use the `/help` command to see available commands:
```
/help
```

### In a Server Channel

1. Simple greeting (no prefix needed):
```
hello
```
The bot should respond with: "Yo, it's Toji. What's up?"

2. Character interaction with the `!toji` command:
```
!toji Hello there!
```
The bot should respond in character as Toji Fushiguro.

### In Direct Messages (DMs)

1. Open a DM with the bot by clicking on its name and selecting "Message"
2. Try the following methods in DMs:
   - Slash commands (`/chat`, `/help`)
   - Simple greeting ("hello")
   - Direct message without any prefix (the bot responds to all DM messages)

If everything is set up correctly, the bot will respond using all these methods in both server channels and DMs.