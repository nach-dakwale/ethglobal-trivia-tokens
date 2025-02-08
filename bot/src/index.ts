import { Client, Events, GatewayIntentBits } from 'discord.js';
import { CONFIG } from './config';
import { setupCommands } from './commands';
import { handleCommand } from './handlers/commandHandler';
import { handleTriviaResponse, initializeClient } from './handlers/triviaHandler';

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Handle ready event
client.once(Events.ClientReady, async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
  
  try {
    // Initialize trivia handler with client
    initializeClient(client);
    
    // Register slash commands
    await setupCommands();
    console.log('Successfully registered application commands.');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
});

// Handle interaction create event
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await handleCommand(interaction, client);
});

// Handle message create event (for trivia answers)
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  await handleTriviaResponse(message);
});

// Login to Discord
client.login(CONFIG.DISCORD_TOKEN).catch(console.error); 