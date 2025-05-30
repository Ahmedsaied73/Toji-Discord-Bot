# Troubleshooting Guide

## Using the Verification Tool

TojiBot now includes a verification tool that can help diagnose common connection issues, especially related to Discord intents.

To run the verification tool:

```bash
npm run verify
```

This tool will:
1. Test if your bot can connect to Discord with basic intents
2. Test if your bot can connect with all required intents (including MessageContent)
3. Provide specific error messages and solutions if any issues are found

## Common Issues

### "Used disallowed intents" Error

**Error Message:**
```
Error: Used disallowed intents
    at WebSocketShard.onClose (node_modules\@discordjs\ws\dist\index.js:1151:18)
```

**Cause:**
This error occurs when your bot tries to use privileged intents that haven't been enabled in the Discord Developer Portal. Specifically, the `MessageContent` intent is required for this bot to function properly.

**Solution:**

1. Run the verification tool to confirm this is the issue:
   ```bash
   npm run verify
   ```
2. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
3. Select your bot application
4. Navigate to the "Bot" tab in the left sidebar
5. Scroll down to the "Privileged Gateway Intents" section
6. Enable the "MESSAGE CONTENT" intent by toggling the switch
7. Click "Save Changes" at the bottom of the page
8. Run the verification tool again to confirm the fix:
   ```bash
   npm run verify
   ```
9. Start your bot using `npm start`

For detailed instructions with screenshots, see [DISCORD_SETUP.md](DISCORD_SETUP.md).

### Bot Crashes and Restarts in a Loop

**Symptom:**
The bot keeps crashing and restarting when using `npm start` or `nodemon`.

**Solution:**

1. Use `node start.js` instead of `nodemon` to run the bot once without auto-restart
2. Fix any configuration issues (like the intents problem above)
3. Once the configuration is correct, you can use `npm run dev` to run with nodemon for development

### Bot Doesn't Respond to Commands

**Possible Causes and Solutions:**

1. **Incorrect Prefix**: Make sure you're using the correct command prefix (`!toji`) or slash commands (`/chat`, `/help`)
2. **Missing Intents**: Ensure the MessageContent intent is enabled as described above
3. **Bot Permissions**: Check that the bot has proper permissions in your Discord server
4. **API Keys**: Verify that all API keys in your `.env` file are correct
5. **Slash Commands Not Registered**: If slash commands aren't appearing, try the following:
   - Make sure you invited the bot with the `applications.commands` scope
   - Restart the bot to trigger slash command registration
   - Wait a few minutes as Discord can take time to register slash commands globally

## Checking Logs

If you're still having issues, check the console output for error messages. Look for specific error codes or messages that might indicate what's wrong.

## Getting Help

If you've tried the solutions above and are still experiencing issues, consider:

1. Checking the [Discord.js Guide](https://discordjs.guide/) for more information
2. Visiting the [Discord.js Documentation](https://discord.js.org/)
3. Joining the [Discord.js Support Server](https://discord.gg/djs) for community help