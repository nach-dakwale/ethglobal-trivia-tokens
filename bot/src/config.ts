import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Configuration schema
const configSchema = z.object({
  // Discord
  DISCORD_TOKEN: z.string(),
  CLIENT_ID: z.string(),

  // OpenAI
  OPENAI_API_KEY: z.string(),
  MODEL: z.literal('gpt-4-turbo-preview'),

  // Blockchain
  CONTRACT_ADDRESS: z.string(),
  PRIVATE_KEY: z.string(),
  RPC_URL: z.string(),
  CHAIN_ID: z.number(),
});

// Parse and validate configuration
export const CONFIG = configSchema.parse({
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  CLIENT_ID: process.env.CLIENT_ID,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  MODEL: 'gpt-4-turbo-preview',
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '0x13250D67E38Ff5B89667627c612F0f72B50347dE',
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  RPC_URL: process.env.RPC_URL || 'https://sepolia.base.org',
  CHAIN_ID: Number(process.env.CHAIN_ID) || 84532,
}); 