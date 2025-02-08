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
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '0xD4fE1b449383228CDB8F2D8E1445C07504768E9E',
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  RPC_URL: process.env.RPC_URL || 'https://mainnet.base.org',
  CHAIN_ID: Number(process.env.CHAIN_ID) || 8453,
}); 