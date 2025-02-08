"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeClient = initializeClient;
exports.handleTriviaCommand = handleTriviaCommand;
exports.handleTriviaResponse = handleTriviaResponse;
const openai_1 = require("../services/openai");
const tokenService_1 = require("../services/tokenService");
// Initialize Discord client
let client;
function initializeClient(discordClient) {
    client = discordClient;
}
// Store active games per channel
const activeGames = new Map();
async function askNewQuestion(channelId, showPreviousAnswer = true) {
    try {
        const game = activeGames.get(channelId);
        if (!game)
            return;
        const channel = await client.channels.fetch(channelId);
        if (!channel?.isTextBased())
            return;
        // If requested, show the answer to the previous question
        if (showPreviousAnswer) {
            await channel.send(`⏰ Time's up! The answer was: **${game.answer}**`);
        }
        // Generate a new question with the theme
        const { question, answer, difficulty } = await (0, openai_1.generateQuestion)(game.theme);
        // Update game state
        game.question = question;
        game.answer = answer;
        game.difficulty = difficulty;
        game.startTime = Date.now();
        // Send the question
        await channel.send(`🎯 New ${game.theme} Trivia Question (${difficulty}):\n\n${question}\n\nReward: ${difficulty === 'hard' ? '10' : '5'} TRIVIA tokens`);
    }
    catch (error) {
        console.error('Error asking new question:', error);
    }
}
async function handleTriviaCommand(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const channelId = interaction.channelId;
    if (subcommand === 'start') {
        // Check if there's already an active game
        if (activeGames.has(channelId)) {
            await interaction.reply({
                content: 'There is already an active trivia game in this channel!',
                ephemeral: true
            });
            return;
        }
        // Get interval and theme from command options
        const interval = interaction.options.getInteger('interval', true);
        const theme = interaction.options.getString('theme', true);
        // Generate initial question with theme
        const { question, answer, difficulty } = await (0, openai_1.generateQuestion)(theme);
        // Set up recurring questions
        const timeoutId = setInterval(() => askNewQuestion(channelId), interval * 60 * 1000);
        activeGames.set(channelId, {
            question,
            answer,
            difficulty,
            startTime: Date.now(),
            interval,
            timeoutId,
            theme
        });
        await interaction.reply({
            content: `🎮 Starting automated ${theme} trivia! Questions will be asked every ${interval} minute${interval === 1 ? '' : 's'}.\n\n🎯 First Question (${difficulty}):\n\n${question}\n\nReward: ${difficulty === 'hard' ? '10' : '5'} TRIVIA tokens`,
            fetchReply: true
        });
    }
    else if (subcommand === 'stop') {
        // Check if user has permission to stop the game
        if (!interaction.memberPermissions?.has('ManageMessages')) {
            await interaction.reply({
                content: 'You do not have permission to stop the trivia game!',
                ephemeral: true
            });
            return;
        }
        const game = activeGames.get(channelId);
        if (!game) {
            await interaction.reply({
                content: 'There is no active trivia game in this channel!',
                ephemeral: true
            });
            return;
        }
        // Show the final answer before stopping
        const channel = await client.channels.fetch(channelId);
        if (channel?.isTextBased()) {
            await channel.send(`🏁 Final answer was: **${game.answer}**`);
        }
        // Clear the interval and remove the game
        clearInterval(game.timeoutId);
        activeGames.delete(channelId);
        await interaction.reply(`Trivia game on ${game.theme} stopped! Thanks for playing! 🎮`);
    }
}
// Handle message responses for trivia
async function handleTriviaResponse(message) {
    const channelId = message.channelId;
    const game = activeGames.get(channelId);
    if (!game)
        return;
    // Validate the answer
    const validation = await (0, openai_1.validateAnswer)(game.answer, message.content);
    if (validation.isCorrect) {
        const reward = game.difficulty === 'hard' ? 10 : 5;
        const partialReward = validation.isPartiallyCorrect ? reward / 2 : reward;
        // Send reward
        try {
            await (0, tokenService_1.rewardUser)(message.author.id, partialReward);
            const rewardMessage = validation.isPartiallyCorrect
                ? `Partially correct! You've earned ${partialReward} TRIVIA tokens. The full answer was: **${game.answer}**`
                : `Correct! You've earned ${reward} TRIVIA tokens. Well done!`;
            await message.reply(rewardMessage);
        }
        catch (error) {
            console.error('Error rewarding user:', error);
            await message.reply('Error processing reward. Please contact an administrator.');
        }
    }
}
