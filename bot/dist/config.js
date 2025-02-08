"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
// Load environment variables
dotenv_1.default.config();
// Configuration schema
const configSchema = zod_1.z.object({
    // Discord
    DISCORD_TOKEN: zod_1.z.string(),
    CLIENT_ID: zod_1.z.string(),
    // OpenAI
    OPENAI_API_KEY: zod_1.z.string(),
    MODEL: zod_1.z.literal('gpt-4-turbo-preview'),
    // Blockchain
    CONTRACT_ADDRESS: zod_1.z.string(),
    PRIVATE_KEY: zod_1.z.string(),
    RPC_URL: zod_1.z.string(),
    CHAIN_ID: zod_1.z.number(),
});
// Parse and validate configuration
exports.CONFIG = configSchema.parse({
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    CLIENT_ID: process.env.CLIENT_ID,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    MODEL: 'gpt-4-turbo-preview',
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || '0x13250D67E38Ff5B89667627c612F0f72B50347dE',
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    RPC_URL: process.env.RPC_URL || 'https://sepolia.base.org',
    CHAIN_ID: Number(process.env.CHAIN_ID) || 84532,
});
