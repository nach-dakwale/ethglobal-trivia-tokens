import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { CONFIG } from '../config';

// Define commands
const commands = [
  new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Start a trivia game')
    .addSubcommand(subcommand =>
      subcommand
        .setName('start')
        .setDescription('Start automated trivia games')
        .addIntegerOption(option =>
          option
            .setName('interval')
            .setDescription('Minutes between questions (1-60)')
            .setMinValue(1)
            .setMaxValue(60)
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('theme')
            .setDescription('Theme for trivia questions (e.g., technology, history, science, gardening)')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stop')
        .setDescription('Stop the automated trivia game')
    ),
  new SlashCommandBuilder()
    .setName('register')
    .setDescription('Register your wallet address')
    .addStringOption(option =>
      option
        .setName('address')
        .setDescription('Your wallet address')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your TRIVIA token balance'),
];

// Setup commands
export async function setupCommands() {
  try {
    console.log('Started refreshing application (/) commands.');

    const rest = new REST().setToken(CONFIG.DISCORD_TOKEN);

    // Register commands
    await rest.put(
      Routes.applicationCommands(CONFIG.CLIENT_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
} 