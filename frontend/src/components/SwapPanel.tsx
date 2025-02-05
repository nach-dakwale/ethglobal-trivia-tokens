import { Box, Container, VStack, Heading, Text } from '@chakra-ui/react';
import { useAccount, useChainId, useWalletClient } from 'wagmi';
import { SwapWidget, Theme, darkTheme } from '@uniswap/widgets';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import { type SupportedChainId } from '@uniswap/widgets';
import { Web3Provider } from '@ethersproject/providers';
import { useEffect, useState } from 'react';
import { TRIVIA_TOKEN_ADDRESS } from '../constants';

// Define the tokens
const TOKENS = [
  {
    address: '0x4200000000000000000000000000000000000006', // Base WETH
    chainId: 8453,
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
    logoURI: 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
  },
  {
    address: TRIVIA_TOKEN_ADDRESS,
    chainId: 8453,
    decimals: 18,
    name: 'TRIVIA',
    symbol: 'TRIVIA',
    logoURI: 'https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png'
  }
];

// Custom theme to match your app's design
const theme: Theme = {
  ...darkTheme,
  primary: '#805AD5',
  secondary: '#2D3748',
  interactive: '#4A5568',
  container: '#1A202C',
  module: '#2D3748',
  accent: '#805AD5',
  outline: '#4A5568',
  dialog: '#2D3748',
  borderRadius: {
    xsmall: 0.25,
    small: 0.5,
    medium: 0.75,
    large: 1
  },
  fontFamily: {
    font: '"Inter", sans-serif',
    variable: '"IBM Plex Mono", monospace'
  },
  tokenColorExtraction: false,
};

// Configure JSON-RPC endpoints
const jsonRpcUrlMap = {
  8453: [
    'https://mainnet.base.org',
  ]
};

// Add Base chain configuration
const CHAIN_INFO = {
  8453: {
    chainId: 8453,
    chainName: 'Base',
    label: 'Base',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    color: '#0052FF',
    logoUrl: 'https://raw.githubusercontent.com/ethereum/ethereum-org/master/eth.png',
    explorerUrl: 'https://basescan.org'
  }
};

export function SwapPanel() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { data: walletClient } = useWalletClient();
  const [provider, setProvider] = useState<Web3Provider | null>(null);

  // Use the wallet client to create a provider
  useEffect(() => {
    if (walletClient && chainId === 8453) {
      const provider = new Web3Provider(walletClient as any);
      setProvider(provider);
    } else {
      setProvider(null);
    }
  }, [walletClient, chainId]);

  if (!isConnected || chainId !== 8453) {
    return (
      <Container maxW="container.md" py={4}>
        <VStack spacing={2}>
          <Heading size="md" color="whiteAlpha.900">Swap</Heading>
          <Text color="whiteAlpha.700">
            {!isConnected 
              ? "Please connect your wallet to use the swap interface"
              : "Please switch to Base network"
            }
          </Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={4}>
      <VStack spacing={4}>
        <VStack spacing={2}>
          <Heading size="md" color="whiteAlpha.900">Swap</Heading>
          <Text color="whiteAlpha.700" fontSize="sm">
            Swap ETH for TRIVIA tokens or vice versa
          </Text>
        </VStack>
        <Box 
          w="full" 
          maxW="500px"
          bg="gray.700" 
          borderRadius="xl"
          borderWidth="1px"
          borderColor="whiteAlpha.200"
          overflow="hidden"
        >
          {provider && (
            <SwapWidget
              provider={provider}
              jsonRpcUrlMap={jsonRpcUrlMap}
              width="100%"
              theme={theme}
              tokenList={TOKENS}
              defaultInputTokenAddress="0x4200000000000000000000000000000000000006"
              defaultOutputTokenAddress={TRIVIA_TOKEN_ADDRESS}
              hideConnectionUI={false}
              defaultChainId={8453 as SupportedChainId}
              routerUrl="https://api.uniswap.org/v1"
              onError={(error) => {
                console.error('Swap Widget Error:', error);
              }}
              brandedFooter={false}
              onConnectWalletClick={() => {
                // Let the widget handle wallet connection if we're not connected
                if (!isConnected) {
                  return true;
                }
                // If we're connected but on wrong chain, let the widget handle it
                if (chainId !== 8453) {
                  return true;
                }
                // We're connected and on right chain, prevent widget connection
                return false;
              }}
            />
          )}
        </Box>
      </VStack>
    </Container>
  );
} 