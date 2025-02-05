import { Box, Container, Heading, Stack, Text, SimpleGrid, Icon } from '@chakra-ui/react';
import { Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/tabs';
import { ChakraProvider } from '@chakra-ui/provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiConfig } from 'wagmi';
import { config } from './wagmi';
import theme from './theme';
import { WalletConnect } from './components/WalletConnect';
import { StakingPanel } from './components/StakingPanel';
import { SwapPanel } from './components/SwapPanel';
import { FaBrain, FaCoins, FaRobot } from 'react-icons/fa';

const queryClient = new QueryClient();

function FeatureCard({ icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <Box textAlign="center" p={6}>
      <Icon as={icon} w={10} h={10} mb={4} color="purple.400" />
      <Heading size="md" mb={2}>{title}</Heading>
      <Text color="whiteAlpha.800">{description}</Text>
    </Box>
  );
}

function App() {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider theme={theme}>
          {/* Outermost container - takes up full viewport */}
          <Box 
            minH="100vh" 
            w="100vw" 
            bg="gray.900" 
            overflowX="hidden"
            display="flex"
            flexDirection="column"
          >
            {/* Main content wrapper - centers content and allows scrolling */}
            <Box 
              flex="1"
              w="full"
              display="flex"
              flexDirection="column"
              justifyContent="center"
              py={{ base: 8, md: 12 }}
            >
              {/* Content container - constrains width */}
              <Container 
                maxW="container.lg" 
                w="full"
                mx="auto"
                px={{ base: 4, md: 6 }}
              >
                <Stack spacing={{ base: 8, md: 12 }} align="center">
                  {/* Hero Section */}
                  <Stack spacing={6} textAlign="center" w="full" maxW="800px" mx="auto">
                    <Heading 
                      size="2xl" 
                      bgGradient="linear(to-r, purple.400, pink.400)" 
                      bgClip="text"
                      lineHeight="1.2"
                    >
                      Trivia Token
                    </Heading>
                    <Heading size="md" color="whiteAlpha.800" fontWeight="normal">
                      The First Ever AI-Powered Play-to-Earn Token
                    </Heading>
                    <Text fontSize="lg" color="whiteAlpha.800" maxW="600px" mx="auto">
                      Earn rewards by playing trivia, stake your tokens for passive income, and enhance your Discord community with our AI-powered bot.
                    </Text>
                    <Box py={4}>
                      <WalletConnect />
                    </Box>
                  </Stack>

                  {/* Features */}
                  <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
                    <FeatureCard
                      icon={FaBrain}
                      title="Play & Earn"
                      description="Answer AI-generated trivia questions and earn TRIVIA tokens"
                    />
                    <FeatureCard
                      icon={FaCoins}
                      title="Stake & Grow"
                      description="Earn up to 400% APY by staking your tokens"
                    />
                    <FeatureCard
                      icon={FaRobot}
                      title="Engage Community"
                      description="Stake 100,000 TRIVIA tokens to add our AI trivia bot to your Discord server"
                    />
                  </SimpleGrid>

                  {/* Main Panels */}
                  <Box w="full">
                    <Tabs variant="soft-rounded" colorScheme="purple" align="center" w="full">
                      <TabList mb={8}>
                        <Tab color="whiteAlpha.700" _selected={{ color: 'white', bg: 'purple.500' }}>Stake</Tab>
                        <Tab color="whiteAlpha.700" _selected={{ color: 'white', bg: 'purple.500' }}>Swap</Tab>
                      </TabList>
                      <TabPanels>
                        <TabPanel p={0}>
                          <StakingPanel />
                        </TabPanel>
                        <TabPanel p={0}>
                          <SwapPanel />
                        </TabPanel>
                      </TabPanels>
                    </Tabs>
                  </Box>
                </Stack>
              </Container>
            </Box>
          </Box>
        </ChakraProvider>
      </QueryClientProvider>
    </WagmiConfig>
  );
}

export default App;
