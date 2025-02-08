"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const config_1 = require("./config");
const commands_1 = require("./commands");
const commandHandler_1 = require("./handlers/commandHandler");
const triviaHandler_1 = require("./handlers/triviaHandler");
// Create Discord client
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
});
// Handle ready event
client.once(discord_js_1.Events.ClientReady, async (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    try {
        // Initialize trivia handler with client
        (0, triviaHandler_1.initializeClient)(client);
        // Register slash commands
        await (0, commands_1.setupCommands)();
        console.log('Successfully registered application commands.');
    }
    catch (error) {
        console.error('Error registering commands:', error);
    }
});
// Handle interaction create event
client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand())
        return;
    await (0, commandHandler_1.handleCommand)(interaction, client);
});
// Handle message create event (for trivia answers)
client.on(discord_js_1.Events.MessageCreate, async (message) => {
    if (message.author.bot)
        return;
    await (0, triviaHandler_1.handleTriviaResponse)(message);
});
// Login to Discord
client.login(config_1.CONFIG.DISCORD_TOKEN).catch(console.error);
