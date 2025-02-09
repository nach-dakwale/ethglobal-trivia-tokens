import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';

// Base Sepolia RPC URL and chain configuration
export const baseSepoliaChain = {
  ...baseSepolia,
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.base.org']
    },
    public: {
      http: ['https://sepolia.base.org']
    }
  },
  blockExplorers: {
    default: {
      name: 'Base Sepolia Explorer',
      url: 'https://sepolia.basescan.org'
    }
  },
  testnet: true
};

// Create wagmi config with Base mainnet
export const config = createConfig({
  chains: [base],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
    metaMask()
  ],
  transports: {
    [base.id]: http('https://mainnet.base.org')
  }
}); 