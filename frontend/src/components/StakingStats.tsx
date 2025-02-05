import { Grid, GridItem, Text, VStack } from '@chakra-ui/react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { TRIVIA_TOKEN_ADDRESS, TRIVIA_TOKEN_ABI } from '../constants';

function StakingStat({ label, value }: { label: string; value: string }) {
  return (
    <VStack align="start" spacing={1}>
      <Text color="whiteAlpha.600" fontSize="sm">{label}</Text>
      <Text color="whiteAlpha.900" fontSize="lg" fontWeight="bold">{value}</Text>
    </VStack>
  );
}

export function StakingStats() {
  const { address } = useAccount();

  const { data: stakedBalance } = useReadContract({
    address: TRIVIA_TOKEN_ADDRESS,
    abi: TRIVIA_TOKEN_ABI,
    functionName: 'getStakedBalance',
    args: [address],
  }) as { data: bigint };

  const { data: pendingRewards } = useReadContract({
    address: TRIVIA_TOKEN_ADDRESS,
    abi: TRIVIA_TOKEN_ABI,
    functionName: 'calculatePendingRewards',
    args: [address],
  }) as { data: bigint };

  return (
    <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap={4}>
      <GridItem>
        <StakingStat
          label="Your Staked Balance"
          value={`${stakedBalance ? formatEther(stakedBalance) : '0'} TRIVIA`}
        />
      </GridItem>
      <GridItem>
        <StakingStat
          label="Pending Rewards"
          value={`${pendingRewards ? formatEther(pendingRewards) : '0'} TRIVIA`}
        />
      </GridItem>
    </Grid>
  );
} 