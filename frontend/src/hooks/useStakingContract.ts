import { useAccount } from 'wagmi';
import { useWriteContract } from 'wagmi';
import { TRIVIA_TOKEN_ADDRESS, TRIVIA_TOKEN_ABI } from '../constants';

export function useStakingContract() {
  const { address } = useAccount();
  const { writeContract } = useWriteContract();

  const claimRewards = async () => {
    if (!address) throw new Error('Wallet not connected');
    
    return writeContract({
      address: TRIVIA_TOKEN_ADDRESS,
      abi: TRIVIA_TOKEN_ABI,
      functionName: 'claimRewards',
    });
  };

  return {
    claimRewards,
    isClaimingRewards: false, // TODO: Add loading state when implementing full contract integration
  };
} 