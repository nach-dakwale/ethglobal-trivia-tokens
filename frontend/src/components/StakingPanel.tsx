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
  SimpleGrid,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Link,
  Card,
  CardBody,
  Icon,
} from '@chakra-ui/react';
import { useAccount, useChainId, useSwitchChain, useReadContract, useWriteContract } from 'wagmi';
import { FaCheckCircle, FaClock, FaDiscord, FaInfoCircle } from 'react-icons/fa';
import { useState } from 'react';
import { useStakingContract } from '../hooks/useStakingContract';
import { StakeForm } from './StakeForm';
import { UnstakeForm } from './UnstakeForm';
import { StakingStats } from './StakingStats';
import { base } from 'wagmi/chains';
import { formatEther } from 'viem';
import { TRIVIA_TOKEN_ADDRESS, TRIVIA_TOKEN_ABI } from '../constants';

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
  // Calculate daily rewards using linear interest
  const dailyEarnings = (Number(stakedAmount) * currentAPY) / (365 * 10000); // APY is in basis points
  const monthlyEarnings = dailyEarnings * 30;
  const yearlyEarnings = dailyEarnings * 365;

  return (
    <Box p={6} bg="whiteAlpha.100" borderRadius="xl">
      <Heading size="sm" mb={4} color="whiteAlpha.900">Your Earnings Projection</Heading>
      <Grid templateColumns="repeat(3, 1fr)" gap={4}>
        <StakingStat
          label="Daily"
          value={`${dailyEarnings.toFixed(2)} TRIVIA`}
          helpText="Based on current APY"
        />
        <StakingStat
          label="Monthly"
          value={`${monthlyEarnings.toFixed(2)} TRIVIA`}
          helpText="30-day projection"
        />
        <StakingStat
          label="Yearly"
          value={`${yearlyEarnings.toFixed(2)} TRIVIA`}
          helpText="365-day projection"
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

function InfoBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card bg="whiteAlpha.100" variant="outline" borderColor="whiteAlpha.200">
      <CardBody>
        <HStack spacing={2} mb={2}>
          <Icon as={FaInfoCircle} color="purple.400" />
          <Text fontWeight="medium" color="whiteAlpha.900">{title}</Text>
        </HStack>
        <Text color="whiteAlpha.800" fontSize="sm">
          {children}
        </Text>
      </CardBody>
    </Card>
  );
}

// Add new component for tax info
function TaxInfo() {
  return (
    <Box p={4} bg="whiteAlpha.50" borderRadius="lg" mt={4}>
      <HStack spacing={2} mb={2}>
        <Icon as={FaInfoCircle} color="purple.400" />
        <Text fontWeight="medium" color="whiteAlpha.900">Transaction Tax</Text>
      </HStack>
      <Text color="whiteAlpha.800" fontSize="sm">
        A 2% tax is applied to all token transfers and unstaking operations. This tax helps maintain protocol stability and funds the treasury for marketing and development.
      </Text>
    </Box>
  );
}

export function StakingPanel() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { 
    requestRewardsClaim, 
    executeRewardsClaim,
    hasPendingClaim,
    canExecuteClaim,
    claimAmount,
    requestTime,
    daysLeft,
  } = useStakingContract();
  const { writeContract, status } = useWriteContract();
  const toast = useToast();

  // Get unstaking state
  const { address } = useAccount();
  const { data: pendingUnstake } = useReadContract({
    address: TRIVIA_TOKEN_ADDRESS as `0x${string}`,
    abi: TRIVIA_TOKEN_ABI,
    functionName: 'getPendingUnstake',
    args: address ? [address] : undefined,
  });

  const [pendingAmount, unstakeRequestTime] = pendingUnstake || [0n, 0n];
  const hasPendingUnstake = pendingAmount > 0n;

  // Calculate current period
  const deploymentDate = new Date();
  deploymentDate.setDate(deploymentDate.getDate() - 1);
  const now = new Date();
  const daysSinceDeployment = Math.floor((now.getTime() - deploymentDate.getTime()) / (24 * 60 * 60 * 1000));

  const isWrongNetwork = chainId !== base.id;

  const handleRequestRewards = async () => {
    try {
      await requestRewardsClaim();
      toast({
        title: 'Success',
        description: 'Rewards claim requested. Please wait for the 7-day cooldown period.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to request rewards claim',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleExecuteRewards = async () => {
    try {
      await executeRewardsClaim();
      toast({
        title: 'Success',
        description: 'Successfully claimed rewards!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to execute rewards claim',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const renderRewardsClaimSection = () => {
    if (hasPendingClaim) {
      return (
        <VStack spacing={2}>
          <Text fontSize="sm" color="whiteAlpha.900">
            Pending claim: {formatEther(claimAmount)} TRIVIA
          </Text>
          {canExecuteClaim ? (
            <Button
              colorScheme="purple"
              size="lg"
              width="full"
              onClick={handleExecuteRewards}
              isLoading={status === 'pending'}
              loadingText="Processing..."
            >
              Claim Rewards
            </Button>
          ) : (
            <HStack spacing={2} color="whiteAlpha.600">
              <FaClock />
              <Text fontSize="sm">
                Available to claim in {daysLeft} days
              </Text>
            </HStack>
          )}
        </VStack>
      );
    }

    return (
      <VStack spacing={2}>
        <Button
          colorScheme="purple"
          size="lg"
          width="full"
          onClick={handleRequestRewards}
          isLoading={status === 'pending'}
          loadingText="Processing..."
        >
          Claim Rewards
        </Button>
        <HStack spacing={2} color="whiteAlpha.600" fontSize="xs">
          <FaClock size="12px" />
          <Text>7-day cooldown period applies after claiming rewards</Text>
        </HStack>
      </VStack>
    );
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

  if (isWrongNetwork) {
    return (
      <Container maxW="container.md" py={4}>
        <VStack spacing={4}>
          <Alert status="warning" variant="solid" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Wrong Network</AlertTitle>
              <AlertDescription>
                Please switch to Base to use the staking interface.
                You'll need Base ETH for gas fees.
              </AlertDescription>
            </Box>
          </Alert>
          <VStack spacing={2}>
            <Button
              colorScheme="purple"
              onClick={() => switchChain({ chainId: base.id })}
            >
              Switch to Base
            </Button>
            <Link
              href="https://sepoliafaucet.com/base"
              isExternal
              color="purple.300"
              fontSize="sm"
            >
              Get Base ETH from Faucet
            </Link>
          </VStack>
          <Text color="whiteAlpha.600" fontSize="sm">
            After switching networks, you may need to refresh the page.
          </Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <VStack spacing={2} mb={6}>
            <Heading size="md" color="whiteAlpha.900">Staking</Heading>
            <Text color="whiteAlpha.700" fontSize="sm">
              Stake your TRIVIA tokens to earn rewards and gain access to the trivia server
            </Text>
          </VStack>
          
          <StakingStats />

          <Box mt={8} p={6} bg="whiteAlpha.50" borderRadius="xl">
            <Text fontSize="sm" color="whiteAlpha.800" mb={4}>Staking Rewards Schedule</Text>
            <SimpleGrid columns={3} spacing={4}>
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
          </Box>
          
          <Grid templateColumns="repeat(2, 1fr)" gap={6} mt={8}>
            <GridItem>
              <VStack spacing={4} align="stretch">
                <StakeForm />
              </VStack>
            </GridItem>
            <GridItem>
              <VStack spacing={4} align="stretch">
                <UnstakeForm />
              </VStack>
            </GridItem>
          </Grid>

          <Divider my={8} borderColor="whiteAlpha.200" />

          <VStack spacing={4} align="stretch">
            <InfoBox title="Staking Information">
              Staked tokens earn rewards based on the current APY schedule. When unstaking,
              you'll receive your staked tokens and accumulated rewards after a 7-day cooldown period.
              A 2% tax applies to unstaked amounts.
            </InfoBox>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
} 