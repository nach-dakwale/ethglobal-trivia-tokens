import { 
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  useToast,
  Divider,
  SimpleGrid
} from '@chakra-ui/react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { TRIVIA_TOKEN_ADDRESS, TRIVIA_TOKEN_ABI } from '../constants';
import { FaCheckCircle, FaClock, FaDiscord } from 'react-icons/fa';
import { useState } from 'react';
import { useStakingContract } from '../hooks/useStakingContract';
import { StakeForm } from './StakeForm';
import { UnstakeForm } from './UnstakeForm';
import { StakingStats } from './StakingStats';

function RewardTier({ 
  period, 
  apy, 
  isActive,
}: { 
  period: string; 
  apy: string; 
  isActive?: boolean;
}) {
  return (
    <Box 
      p={3}
      borderRadius="lg" 
      bg={isActive ? 'whiteAlpha.200' : 'whiteAlpha.50'}
      borderWidth="1px"
      borderColor={isActive ? 'purple.400' : 'whiteAlpha.100'}
      transition="all 0.2s"
      _hover={{ borderColor: 'purple.400', transform: 'translateY(-1px)' }}
    >
      <VStack spacing={1} align="start">
        <Text fontSize="sm" color="whiteAlpha.700">{period}</Text>
        <Text 
          color={isActive ? 'purple.400' : 'whiteAlpha.900'}
          fontSize="lg"
          fontWeight="bold"
        >
          {apy} APY
        </Text>
      </VStack>
    </Box>
  );
}

function StakingStat({ label, value, helpText }: { label: string; value: string; helpText?: string }) {
  return (
    <Box textAlign="center">
      <Text color="whiteAlpha.700" fontSize="sm">{label}</Text>
      <Text color="whiteAlpha.900" fontSize="2xl" fontWeight="bold">{value}</Text>
      {helpText && <Text color="whiteAlpha.600" fontSize="sm">{helpText}</Text>}
    </Box>
  );
}

function EarningsCalculator({
  stakedAmount,
  currentAPY
}: {
  stakedAmount: bigint;
  currentAPY: number;
}) {
  const dailyRate = currentAPY / 365;
  const dailyEarnings = (Number(stakedAmount) * dailyRate) / 100;
  const monthlyEarnings = dailyEarnings * 30;
  const yearlyEarnings = dailyEarnings * 365;

  return (
    <Box p={6} bg="whiteAlpha.100" borderRadius="xl">
      <Heading size="sm" mb={4} color="whiteAlpha.900">Your Earnings Projection</Heading>
      <Grid templateColumns="repeat(3, 1fr)" gap={4}>
        <StakingStat
          label="Daily"
          value={`${dailyEarnings.toFixed(2)} TRIVIA`}
        />
        <StakingStat
          label="Monthly"
          value={`${monthlyEarnings.toFixed(2)} TRIVIA`}
        />
        <StakingStat
          label="Yearly"
          value={`${yearlyEarnings.toFixed(2)} TRIVIA`}
        />
      </Grid>
    </Box>
  );
}

function DiscordBotInstructions() {
  return (
    <Box p={6} bg="whiteAlpha.100" borderRadius="xl">
      <HStack spacing={4} mb={4}>
        <FaDiscord size="24px" color="#7289da" />
        <Heading size="sm">Add Trivia Bot to Your Server</Heading>
      </HStack>
      <VStack spacing={3} align="start">
        <Text>1. Click the "Add to Discord" button below</Text>
        <Text>2. Select your server from the dropdown</Text>
        <Text>3. Review and grant the required permissions</Text>
        <Text>4. Use <Text as="span" color="purple.400" fontFamily="mono">/trivia start</Text> to begin a game</Text>
      </VStack>
      <Button
        leftIcon={<FaDiscord />}
        mt={6}
        size="lg"
        w="full"
        colorScheme="purple"
        as="a"
        href="https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2048&scope=bot%20applications.commands"
        target="_blank"
      >
        Add to Discord
      </Button>
    </Box>
  );
}

export function StakingPanel() {
  const { isConnected } = useAccount();
  const { claimRewards, isClaimingRewards } = useStakingContract();
  const toast = useToast();

  // Calculate current period
  const deploymentDate = new Date(); // Start from today to ensure we're in first period
  deploymentDate.setDate(deploymentDate.getDate() - 1); // Set to yesterday to ensure we're at the start
  const now = new Date();
  const daysSinceDeployment = Math.floor((now.getTime() - deploymentDate.getTime()) / (24 * 60 * 60 * 1000));

  const handleClaimRewards = async () => {
    try {
      await claimRewards();
      toast({
        title: 'Success',
        description: 'Rewards claimed successfully!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to claim rewards',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (!isConnected) {
    return (
      <Container maxW="container.md" py={4}>
        <VStack spacing={2}>
          <Heading size="md" color="whiteAlpha.900">Staking</Heading>
          <Text color="whiteAlpha.700">
            Please connect your wallet to use the staking interface
          </Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={4}>
      <VStack spacing={4} align="stretch">
        <Box>
          <VStack spacing={2} mb={4}>
            <Heading size="md" color="whiteAlpha.900">Staking</Heading>
            <Text color="whiteAlpha.700" fontSize="sm">
              Stake your TRIVIA tokens to earn rewards and gain access to the trivia server
            </Text>
          </VStack>
          
          <StakingStats />

          <Box mt={4} p={4} bg="whiteAlpha.50" borderRadius="xl">
            <Text fontSize="sm" color="whiteAlpha.800" mb={3}>Staking Rewards Schedule</Text>
            <SimpleGrid columns={3} spacing={3} mb={2}>
              <RewardTier 
                period="First 3 months" 
                apy="400%" 
                isActive={daysSinceDeployment <= 90}
              />
              <RewardTier 
                period="Months 4-6" 
                apy="250%" 
                isActive={daysSinceDeployment > 90 && daysSinceDeployment <= 180}
              />
              <RewardTier 
                period="Months 7-12" 
                apy="200%" 
                isActive={daysSinceDeployment > 180}
              />
            </SimpleGrid>
            <HStack spacing={2} color="whiteAlpha.600" fontSize="xs" mt={2}>
              <FaClock size="12px" />
              <Text>All earned rewards have a 7-day vesting period</Text>
            </HStack>
          </Box>
          
          <HStack spacing={4} mt={4}>
            <Box flex="1">
              <StakeForm />
            </Box>
            <Box flex="1">
              <UnstakeForm />
            </Box>
          </HStack>

          <Button
            colorScheme="purple"
            size="lg"
            width="full"
            mt={4}
            onClick={handleClaimRewards}
            isLoading={isClaimingRewards}
            loadingText="Claiming..."
          >
            Claim Rewards
          </Button>
        </Box>
      </VStack>
    </Container>
  );
} 