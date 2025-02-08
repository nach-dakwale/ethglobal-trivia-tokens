import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

// Load .env.mainnet for mainnet deployment
dotenv.config({ path: '.env.mainnet' });

// Remove '0x' prefix if present and ensure the key is valid
const PRIVATE_KEY = (process.env.PRIVATE_KEY || "").replace('0x', '');
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const MAINNET_RPC = process.env.MAINNET_RPC || "https://mainnet.base.org";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    "base": {
      url: MAINNET_RPC,
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 8453,
    },
    "base-sepolia": {
      url: "https://sepolia.base.org",
      accounts: [`0x${PRIVATE_KEY}`],
      chainId: 84532,
    },
  },
  etherscan: {
    apiKey: {
      "base": ETHERSCAN_API_KEY,
      "base-sepolia": ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org",
        },
      },
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
};

export default config;
