import { Grid, GridItem, Text, VStack } from '@chakra-ui/react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther } from 'viem';
import { TRIVIA_TOKEN_ADDRESS, TRIVIA_TOKEN_ABI } from '../constants';

function StakingStat({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <VStack align="start" spacing={1}>
      <Text color="whiteAlpha.600" fontSize="sm">{label}</Text>
      <Text color="whiteAlpha.900" fontSize="lg" fontWeight="bold">{value}</Text>
      {subValue && (
        <Text color="whiteAlpha.600" fontSize="xs">
          {subValue}
        </Text>
      )}
    </VStack>
  );
}

export function StakingStats() {
  const { address } = useAccount();

  const { data: stakedBalance, refetch: refetchStakedBalance } = useReadContract({
    address: TRIVIA_TOKEN_ADDRESS as `0x${string}`,
    abi: TRIVIA_TOKEN_ABI,
    functionName: 'getStakedBalance',
    args: address ? [address] : undefined,
  }) as { data: bigint, refetch: () => void };

  const { data: pendingRewards, refetch: refetchPendingRewards } = useReadContract({
    address: TRIVIA_TOKEN_ADDRESS as `0x${string}`,
    abi: TRIVIA_TOKEN_ABI,
    functionName: 'calculatePendingRewards',
    args: address ? [address] : undefined,
  }) as { data: bigint, refetch: () => void };

  // Get any rewards that were locked in when requesting rewards claim
  const { data: pendingRewardsData } = useReadContract({
    address: TRIVIA_TOKEN_ADDRESS as `0x${string}`,
    abi: TRIVIA_TOKEN_ABI,
    functionName: 'getPendingRewards',
    args: address ? [address] : undefined,
  }) as { data: [bigint, bigint] };

  // Export refetch functions
  if (typeof window !== 'undefined') {
    (window as any).refetchStakingStats = () => {
      refetchStakedBalance();
      refetchPendingRewards();
    };
  }

  const requestedRewards = pendingRewardsData ? pendingRewardsData[0] : 0n;
  const totalPendingRewards = (pendingRewards || 0n) + requestedRewards;

  // Format rewards for display
  const formattedActiveRewards = pendingRewards ? formatEther(pendingRewards) : '0';
  const formattedLockedRewards = requestedRewards ? formatEther(requestedRewards) : '0';
  const formattedTotalRewards = formatEther(totalPendingRewards);

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
          label="Total Pending Rewards"
          value={`${Number(formattedTotalRewards).toFixed(4)} TRIVIA`}
          subValue={requestedRewards > 0n ? `Includes ${Number(formattedLockedRewards).toFixed(4)} locked rewards` : undefined}
        />
      </GridItem>
    </Grid>
  );
} 