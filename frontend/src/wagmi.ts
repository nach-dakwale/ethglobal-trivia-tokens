import { createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { injected, metaMask } from 'wagmi/connectors';

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