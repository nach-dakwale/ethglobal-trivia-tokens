"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleBalanceCommand = handleBalanceCommand;
const users_1 = require("../db/users");
const tokenService_1 = require("../services/tokenService");
async function handleBalanceCommand(interaction) {
    try {
        const walletAddress = await (0, users_1.getUserWallet)(interaction.user.id);
        if (!walletAddress) {
            await interaction.reply({
                content: 'You have not registered a wallet address yet! Use `/register` to register your wallet.',
                ephemeral: true
            });
            return;
        }
        const balance = await (0, tokenService_1.getBalance)(walletAddress);
        await interaction.reply({
            content: `Your TRIVIA token balance: \`${balance} TRIVIA\``,
            ephemeral: true
        });
    }
    catch (error) {
        console.error('Error checking balance:', error);
        await interaction.reply({
            content: 'There was an error checking your balance. Please try again later.',
            ephemeral: true
        });
    }
}
