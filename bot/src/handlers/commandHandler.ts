import { Client, Interaction } from 'discord.js';
import { handleTriviaCommand } from './triviaHandler';
import { handleRegisterCommand } from './registerHandler';
import { handleBalanceCommand } from './balanceHandler';

export async function handleCommand(interaction: Interaction, client: Client) {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    switch (commandName) {
      case 'trivia':
        await handleTriviaCommand(interaction);
        break;
      case 'register':
        await handleRegisterCommand(interaction);
        break;
      case 'balance':
        await handleBalanceCommand(interaction);
        break;
      default:
        await interaction.reply({ content: 'Unknown command!', ephemeral: true });
    }
  } catch (error) {
    console.error('Error handling command:', error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: 'There was an error executing this command!' });
    } else {
      await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
    }
  }
} 