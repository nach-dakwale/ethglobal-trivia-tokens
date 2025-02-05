import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';

const INFURA_PROJECT_ID = import.meta.env.VITE_INFURA_PROJECT_ID;
const INFURA_RPC_URL = `https://base-sepolia.infura.io/v3/${INFURA_PROJECT_ID}`;

// Configure Base Sepolia with Infura
const baseSepoliaChain = {
  ...baseSepolia,
  rpcUrls: {
    ...baseSepolia.rpcUrls,
    default: {
      http: [INFURA_RPC_URL, 'https://sepolia.base.org']
    },
    public: {
      http: [INFURA_RPC_URL, 'https://sepolia.base.org']
    }
  }
};

// Create wagmi config with additional options
export const config = createConfig({
  chains: [baseSepoliaChain],
  connectors: [
    metaMask(),
    injected()
  ],
  transports: {
    [baseSepoliaChain.id]: http(INFURA_RPC_URL, {
      batch: {
        batchSize: 1024,
        wait: 16
      },
      fetchOptions: {
        headers: {
          'Content-Type': 'application/json'
        }
      },
      retryCount: 3,
      retryDelay: 1000,
      timeout: 30000
    })
  }
}); 