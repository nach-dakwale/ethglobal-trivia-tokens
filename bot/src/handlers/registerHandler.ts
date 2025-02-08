import { ChatInputCommandInteraction } from 'discord.js';
import { ethers } from 'ethers';
import { registerUserWallet } from '../db/users';

export async function handleRegisterCommand(interaction: ChatInputCommandInteraction) {
  try {
    const walletAddress = interaction.options.getString('address', true);

    // Validate wallet address
    if (!ethers.isAddress(walletAddress)) {
      await interaction.reply({
        content: 'Invalid wallet address! Please provide a valid Ethereum address.',
        ephemeral: true
      });
      return;
    }

    // Register wallet
    await registerUserWallet(interaction.user.id, walletAddress);

    await interaction.reply({
      content: `Successfully registered wallet address: \`${walletAddress}\``,
      ephemeral: true
    });
  } catch (error) {
    console.error('Error registering wallet:', error);
    await interaction.reply({
      content: 'There was an error registering your wallet. Please try again later.',
      ephemeral: true
    });
  }
} 