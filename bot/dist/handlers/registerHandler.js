"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRegisterCommand = handleRegisterCommand;
const ethers_1 = require("ethers");
const users_1 = require("../db/users");
async function handleRegisterCommand(interaction) {
    try {
        const walletAddress = interaction.options.getString('address', true);
        // Validate wallet address
        if (!ethers_1.ethers.isAddress(walletAddress)) {
            await interaction.reply({
                content: 'Invalid wallet address! Please provide a valid Ethereum address.',
                ephemeral: true
            });
            return;
        }
        // Register wallet
        await (0, users_1.registerUserWallet)(interaction.user.id, walletAddress);
        await interaction.reply({
            content: `Successfully registered wallet address: \`${walletAddress}\``,
            ephemeral: true
        });
    }
    catch (error) {
        console.error('Error registering wallet:', error);
        await interaction.reply({
            content: 'There was an error registering your wallet. Please try again later.',
            ephemeral: true
        });
    }
}
