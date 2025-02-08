import { ChatInputCommandInteraction, Client } from 'discord.js';
import { generateQuestion, validateAnswer } from '../services/openai';
import { rewardUser } from '../services/tokenService';

// Initialize Discord client
let client: Client;

export function initializeClient(discordClient: Client) {
  client = discordClient;
}

// Store active games and question history per channel
const activeGames = new Map<string, {
  question: string;
  answer: string;
  difficulty: 'easy' | 'hard';
  startTime: number;
  interval: number;
  timeoutId: NodeJS.Timeout;
  theme: string;
  questionHistory: Set<string>;
}>();

// Maximum number of questions to keep in history
const MAX_HISTORY_SIZE = 50;

async function askNewQuestion(channelId: string, showPreviousAnswer: boolean = true) {
  try {
    const game = activeGames.get(channelId);
    if (!game) return;

    const channel = await client.channels.fetch(channelId);
    if (!channel?.isTextBased()) return;

    // If requested, show the answer to the previous question
    if (showPreviousAnswer) {
      await channel.send(`⏰ Time's up! The answer was: **${game.answer}**`);
    }

    // Generate a new question with the theme
    let newQuestion;
    let attempts = 0;
    const maxAttempts = 5;

    // Keep trying to get a unique question
    do {
      newQuestion = await generateQuestion(game.theme);
      attempts++;
    } while (
      game.questionHistory.has(newQuestion.question.toLowerCase()) && 
      attempts < maxAttempts
    );

    // If we couldn't get a unique question after max attempts, clear some history
    if (attempts >= maxAttempts) {
      const historyArray = Array.from(game.questionHistory);
      // Remove the oldest 20% of questions
      const questionsToRemove = Math.ceil(historyArray.length * 0.2);
      for (let i = 0; i < questionsToRemove; i++) {
        game.questionHistory.delete(historyArray[i]);
      }
    }

    // Add new question to history
    game.questionHistory.add(newQuestion.question.toLowerCase());

    // Trim history if it exceeds maximum size
    if (game.questionHistory.size > MAX_HISTORY_SIZE) {
      const historyArray = Array.from(game.questionHistory);
      game.questionHistory = new Set(historyArray.slice(-MAX_HISTORY_SIZE));
    }
    
    // Update game state
    game.question = newQuestion.question;
    game.answer = newQuestion.answer;
    game.difficulty = newQuestion.difficulty;
    game.startTime = Date.now();

    // Send the question
    await channel.send(`🎯 New ${game.theme} Trivia Question (${newQuestion.difficulty}):\n\n${newQuestion.question}\n\nReward: ${newQuestion.difficulty === 'hard' ? '10' : '5'} TRIVIA tokens`);
  } catch (error) {
    console.error('Error asking new question:', error);
  }
}

export async function handleTriviaCommand(interaction: ChatInputCommandInteraction) {
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
    const { question, answer, difficulty } = await generateQuestion(theme);
    
    // Set up recurring questions
    const timeoutId = setInterval(() => askNewQuestion(channelId), interval * 60 * 1000);
    
    // Initialize game state with empty question history
    activeGames.set(channelId, {
      question,
      answer,
      difficulty,
      startTime: Date.now(),
      interval,
      timeoutId,
      theme,
      questionHistory: new Set([question.toLowerCase()])
    });

    await interaction.reply({
      content: `🎮 Starting automated ${theme} trivia! Questions will be asked every ${interval} minute${interval === 1 ? '' : 's'}.\n\n🎯 First Question (${difficulty}):\n\n${question}\n\nReward: ${difficulty === 'hard' ? '10' : '5'} TRIVIA tokens`,
      fetchReply: true
    });

  } else if (subcommand === 'stop') {
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
export async function handleTriviaResponse(message: any) {
  const channelId = message.channelId;
  const game = activeGames.get(channelId);

  if (!game) return;

  // Validate the answer
  const validation = await validateAnswer(game.answer, message.content);
  
  if (validation.isCorrect) {
    const reward = game.difficulty === 'hard' ? 10 : 5;
    const partialReward = validation.isPartiallyCorrect ? reward / 2 : reward;
    
    // Send reward
    try {
      await rewardUser(message.author.id, partialReward);
      
      const rewardMessage = validation.isPartiallyCorrect 
        ? `Partially correct! You've earned ${partialReward} TRIVIA tokens. The full answer was: **${game.answer}**`
        : `Correct! You've earned ${reward} TRIVIA tokens. Well done!`;
        
      await message.reply(rewardMessage);
    } catch (error) {
      console.error('Error rewarding user:', error);
      await message.reply('Error processing reward. Please contact an administrator.');
    }
  }
} 