"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCommand = handleCommand;
const triviaHandler_1 = require("./triviaHandler");
const registerHandler_1 = require("./registerHandler");
const balanceHandler_1 = require("./balanceHandler");
async function handleCommand(interaction, client) {
    if (!interaction.isChatInputCommand())
        return;
    const { commandName } = interaction;
    try {
        switch (commandName) {
            case 'trivia':
                await (0, triviaHandler_1.handleTriviaCommand)(interaction);
                break;
            case 'register':
                await (0, registerHandler_1.handleRegisterCommand)(interaction);
                break;
            case 'balance':
                await (0, balanceHandler_1.handleBalanceCommand)(interaction);
                break;
            default:
                await interaction.reply({ content: 'Unknown command!', ephemeral: true });
        }
    }
    catch (error) {
        console.error('Error handling command:', error);
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply({ content: 'There was an error executing this command!' });
        }
        else {
            await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
        }
    }
}
