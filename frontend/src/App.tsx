import { ChakraProvider } from '@chakra-ui/react'
import { WagmiConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './wagmi'
import theme from './theme'
import { StakingPanel } from './components/StakingPanel'
import { WalletConnect } from './components/WalletConnect'
import { Box, Container, VStack, Heading, Text, SimpleGrid, Icon, Button, Link, HStack } from '@chakra-ui/react'
import { FaGamepad, FaCoins, FaDiscord, FaExternalLinkAlt } from 'react-icons/fa'
import { TRIVIA_TOKEN_ADDRESS } from './constants'

// Create a client
const queryClient = new QueryClient()

function FeatureCard({ icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <VStack
      spacing={4}
      p={6}
      bg="whiteAlpha.100"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      align="center"
      textAlign="center"
    >
      <Icon as={icon} boxSize={8} color="purple.400" />
      <VStack spacing={2}>
        <Text fontSize="lg" fontWeight="bold" color="whiteAlpha.900">
          {title}
        </Text>
        <Text color="whiteAlpha.700">
          {description}
        </Text>
      </VStack>
    </VStack>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={config}>
        <ChakraProvider theme={theme}>
          <Container maxW="container.lg" py={8}>
            <VStack spacing={12}>
              <VStack spacing={4} textAlign="center">
                <Heading size="2xl" bgGradient="linear(to-r, purple.400, pink.400)" bgClip="text">
                  Trivia Token
                </Heading>
                <Text fontSize="xl" color="whiteAlpha.900">
                  Play trivia, earn tokens, and stake for rewards
                </Text>
                <Text fontSize="md" color="whiteAlpha.700" maxW="container.md">
                  Join our Discord community, participate in trivia games, and earn TRIVIA tokens. 
                  Stake your earnings for high APY rewards and exclusive access to premium features.
                </Text>
              </VStack>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
                <FeatureCard
                  icon={FaGamepad}
                  title="Play & Earn"
                  description="Get paid to answer trivia questions on Discord"
                />
                <FeatureCard
                  icon={FaCoins}
                  title="Stake & Grow"
                  description="Stake your TRIVIA tokens to earn up to 400% APY in rewards"
                />
                <FeatureCard
                  icon={FaDiscord}
                  title="Engage Community"
                  description="Add our Discord bot to your server to increase engagement"
                />
              </SimpleGrid>

              <Box w="full" display="flex" justifyContent="center">
                <WalletConnect />
              </Box>

              <VStack spacing={8} w="full">
                <StakingPanel />
                <HStack spacing={4}>
                  <Link 
                    href={`https://app.uniswap.org/swap?chain=base&outputCurrency=${TRIVIA_TOKEN_ADDRESS}`}
                    isExternal
                    _hover={{ textDecoration: 'none' }}
                  >
                    <Button
                      size="lg"
                      leftIcon={<FaExternalLinkAlt />}
                      colorScheme="purple"
                      variant="outline"
                    >
                      Trade on Uniswap
                    </Button>
                  </Link>
                </HStack>
              </VStack>
            </VStack>
          </Container>
        </ChakraProvider>
      </WagmiConfig>
    </QueryClientProvider>
  )
}

export default App
