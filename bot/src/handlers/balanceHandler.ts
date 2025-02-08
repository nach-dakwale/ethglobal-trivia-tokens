import { ChatInputCommandInteraction } from 'discord.js';
import { getUserWallet } from '../db/users';
import { getBalance } from '../services/tokenService';

export async function handleBalanceCommand(interaction: ChatInputCommandInteraction) {
  try {
    const walletAddress = await getUserWallet(interaction.user.id);

    if (!walletAddress) {
      await interaction.reply({
        content: 'You have not registered a wallet address yet! Use `/register` to register your wallet.',
        ephemeral: true
      });
      return;
    }

    const balance = await getBalance(walletAddress);

    await interaction.reply({
      content: `Your TRIVIA token balance: \`${balance} TRIVIA\``,
      ephemeral: true
    });
  } catch (error) {
    console.error('Error checking balance:', error);
    await interaction.reply({
      content: 'There was an error checking your balance. Please try again later.',
      ephemeral: true
    });
  }
} 