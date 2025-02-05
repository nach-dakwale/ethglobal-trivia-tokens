import { Button } from '@chakra-ui/button';
import { Stack } from '@chakra-ui/layout';
import { Text } from '@chakra-ui/react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <Stack direction="row" spacing={4} align="center" justify="center">
        <Text fontSize="md" color="whiteAlpha.900">
          Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
        </Text>
        <Button
          variant="outline"
          size="md"
          onClick={() => disconnect()}
          _hover={{ bg: 'whiteAlpha.100' }}
        >
          Disconnect
        </Button>
      </Stack>
    );
  }

  return (
    <Button
      size="lg"
      onClick={() => connect({ connector: injected() })}
      px={8}
      py={6}
      fontSize="lg"
      bgGradient="linear(to-r, purple.500, pink.500)"
      _hover={{
        bgGradient: 'linear(to-r, purple.600, pink.600)',
      }}
      _active={{
        bgGradient: 'linear(to-r, purple.700, pink.700)',
      }}
    >
      Connect Wallet
    </Button>
  );
} 