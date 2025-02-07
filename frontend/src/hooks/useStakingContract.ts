import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { TRIVIA_TOKEN_ADDRESS, TRIVIA_TOKEN_ABI } from '../constants';

export function useStakingContract() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  const { data: pendingRewards, refetch: refetchPendingRewards } = useReadContract({
    address: TRIVIA_TOKEN_ADDRESS,
    abi: TRIVIA_TOKEN_ABI,
    functionName: 'getPendingRewards',
    args: address ? [address] : undefined,
  });

  const [claimAmount, requestTime] = pendingRewards || [0n, 0n];
  const hasPendingClaim = claimAmount > 0n;
  
  // Calculate days left for claim
  const now = Math.floor(Date.now() / 1000);
  const unlockTime = Number(requestTime) + (7 * 24 * 60 * 60);
  const daysLeft = requestTime > 0n ? Math.ceil((unlockTime - now) / (24 * 60 * 60)) : 0;
  const canExecuteClaim = hasPendingClaim && requestTime > 0n && daysLeft <= 0;

  const requestRewardsClaim = async () => {
    if (!address) throw new Error('Wallet not connected');
    
    return writeContract({
      address: TRIVIA_TOKEN_ADDRESS,
      abi: TRIVIA_TOKEN_ABI,
      functionName: 'requestRewardsClaim',
      gas: BigInt(300000),
    });
  };

  const executeRewardsClaim = async () => {
    if (!address) throw new Error('Wallet not connected');
    if (!canExecuteClaim) throw new Error('Cooldown period not met');
    
    return writeContract({
      address: TRIVIA_TOKEN_ADDRESS,
      abi: TRIVIA_TOKEN_ABI,
      functionName: 'executeRewardsClaim',
      gas: BigInt(300000),
    });
  };

  return {
    requestRewardsClaim,
    executeRewardsClaim,
    hasPendingClaim,
    canExecuteClaim,
    claimAmount,
    requestTime,
    daysLeft,
    refetchPendingRewards,
  };
} 