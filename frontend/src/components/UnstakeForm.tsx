import { FormControl, FormLabel, Input, Button, useToast, VStack, Text, HStack, Divider } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useWriteContract, useReadContract, useAccount, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { TRIVIA_TOKEN_ADDRESS, TRIVIA_TOKEN_ABI } from '../constants';
import { FaClock } from 'react-icons/fa';

export function UnstakeForm() {
  const [amount, setAmount] = useState('');
  const [calculatedAmount, setCalculatedAmount] = useState<string>('...');
  const { writeContract, data: hash, status, error } = useWriteContract();
  const { data: receipt, isLoading: isWaitingForTransaction } = useWaitForTransactionReceipt({ hash });
  const { address } = useAccount();
  const toast = useToast();

  // Get tax rate
  const { data: taxRate } = useReadContract({
    address: TRIVIA_TOKEN_ADDRESS as `0x${string}`,
    abi: TRIVIA_TOKEN_ABI,
    functionName: 'TAX_RATE',
  });

  // Get staked balance
  const { data: stakedBalance } = useReadContract({
    address: TRIVIA_TOKEN_ADDRESS as `0x${string}`,
    abi: TRIVIA_TOKEN_ABI,
    functionName: 'getStakedBalance',
    args: address ? [address] : undefined,
  });

  // Get pending unstake info
  const { data: pendingUnstake, refetch: refetchPendingUnstake } = useReadContract({
    address: TRIVIA_TOKEN_ADDRESS as `0x${string}`,
    abi: TRIVIA_TOKEN_ABI,
    functionName: 'getPendingUnstake',
    args: address ? [address] : undefined,
  });

  // Add cooldown override check
  const { data: hasOverride, refetch: refetchOverride } = useReadContract({
    address: TRIVIA_TOKEN_ADDRESS as `0x${string}`,
    abi: TRIVIA_TOKEN_ABI,
    functionName: 'hasCooldownOverride',
    args: address ? [address] : undefined,
  });

  // Add effect to periodically check override status
  useEffect(() => {
    const checkOverride = () => {
      refetchOverride();
    };
    
    // Check immediately
    checkOverride();
    
    // Then check every 5 seconds
    const interval = setInterval(checkOverride, 5000);
    
    return () => clearInterval(interval);
  }, [refetchOverride]);

  const [pendingAmount, requestTime] = pendingUnstake || [0n, 0n];
  const hasPendingUnstake = pendingAmount > 0n;
  
  // Add console logging for debugging
  console.log('Override status:', {
    hasOverride,
    pendingAmount: pendingAmount.toString(),
    requestTime: requestTime.toString(),
    hasPendingUnstake
  });

  const canExecuteUnstake = hasPendingUnstake && (
    hasOverride || 
    (requestTime > 0n && BigInt(Math.floor(Date.now() / 1000)) >= requestTime + BigInt(7 * 24 * 60 * 60))
  );

  // Calculate amount after tax
  useEffect(() => {
    const calculateTax = async () => {
      if (!amount) {
        setCalculatedAmount('...');
        return;
      }

      try {
        const amountInWei = parseEther(amount);
        const taxRateValue = taxRate ? Number(taxRate) : 200; // 200 = 2%
        const taxMultiplier = (10000 - taxRateValue) / 10000;
        const amountAfterTax = Number(amount) * taxMultiplier;
        setCalculatedAmount(amountAfterTax.toFixed(2));
      } catch (err) {
        console.error('Error calculating tax:', err);
        setCalculatedAmount('...');
      }
    };

    calculateTax();
  }, [amount, taxRate]);

  // Get total pending amount (staked + rewards)
  const { data: totalPendingAmount, refetch: refetchTotalPending } = useReadContract({
    address: TRIVIA_TOKEN_ADDRESS as `0x${string}`,
    abi: TRIVIA_TOKEN_ABI,
    functionName: 'getTotalPendingAmount',
    args: address ? [address] : undefined,
  });

  const handleRequestUnstake = async () => {
    if (!address || !stakedBalance) return;

    try {
      writeContract({
        address: TRIVIA_TOKEN_ADDRESS as `0x${string}`,
        abi: TRIVIA_TOKEN_ABI,
        functionName: 'requestUnstake',
        args: [stakedBalance],
        gas: BigInt(300000),
      });
    } catch (err) {
      console.error('Unstaking error:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to request unstake',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleExecuteUnstake = async () => {
    if (!address || !canExecuteUnstake) return;

    try {
      writeContract({
        address: TRIVIA_TOKEN_ADDRESS as `0x${string}`,
        abi: TRIVIA_TOKEN_ABI,
        functionName: 'executeUnstake',
        gas: BigInt(300000),
      });
    } catch (err) {
      console.error('Execute unstake error:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to execute unstake',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Success toast after transaction confirmation
  useEffect(() => {
    if (receipt) {
      if (hasPendingUnstake) {
        toast({
          title: 'Success',
          description: `Successfully executed unstake of ${formatEther(pendingAmount)} TRIVIA tokens`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        // Refresh staking stats and rewards after successful unstake
        if (typeof window !== 'undefined') {
          if ((window as any).refetchStakingStats) {
            (window as any).refetchStakingStats();
          }
        }
        refetchTotalPending();
      } else if (amount) {
        toast({
          title: 'Success',
          description: `Successfully requested to unstake ${amount} TRIVIA tokens`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setAmount('');
        // Refresh staking stats immediately after requesting unstake
        if (typeof window !== 'undefined') {
          if ((window as any).refetchStakingStats) {
            (window as any).refetchStakingStats();
          }
        }
        refetchTotalPending();
      }
      refetchPendingUnstake();
    }
  }, [receipt, amount, toast, hasPendingUnstake, pendingAmount, refetchPendingUnstake, refetchTotalPending]);

  const isLoading = status === 'pending' || isWaitingForTransaction;
  const taxRatePercentage = taxRate ? Number(taxRate) / 100 : 2;
  const formattedStakedBalance = stakedBalance ? formatEther(stakedBalance) : '0';

  if (hasPendingUnstake) {
    const now = Math.floor(Date.now() / 1000);
    const unlockTime = Number(requestTime) + (7 * 24 * 60 * 60);
    const daysLeft = Math.ceil((unlockTime - now) / (24 * 60 * 60));
    const pendingAmountAfterTax = pendingAmount - (pendingAmount * 200n) / 10000n; // 2% tax

    return (
      <VStack spacing={4} align="stretch">
        <Text fontSize="sm" color="whiteAlpha.900">
          Pending unstake: {formatEther(pendingAmount)} TRIVIA
        </Text>
        <Text fontSize="sm" color="whiteAlpha.600">
          You will receive: {formatEther(pendingAmountAfterTax)} TRIVIA (after 2% tax)
        </Text>
        <Text fontSize="sm" color="whiteAlpha.600">
          Includes your staked balance and accumulated rewards
        </Text>
        {hasOverride ? (
          <Button
            colorScheme="purple"
            variant="solid"
            onClick={handleExecuteUnstake}
            isLoading={isLoading}
            loadingText="Processing..."
          >
            Unstake Now (Override Active)
          </Button>
        ) : canExecuteUnstake ? (
          <Button
            colorScheme="purple"
            variant="outline"
            onClick={handleExecuteUnstake}
            isLoading={isLoading}
            loadingText="Processing..."
          >
            Unstake
          </Button>
        ) : (
          <HStack spacing={2} color="whiteAlpha.600">
            <FaClock />
            <Text fontSize="sm">
              Available to withdraw in {daysLeft} days
            </Text>
          </HStack>
        )}
      </VStack>
    );
  }

  return (
    <FormControl>
      <FormLabel color="whiteAlpha.700">Unstake Amount</FormLabel>
      <VStack spacing={4}>
        <VStack spacing={2} w="full">
          <Text fontSize="sm" color="whiteAlpha.600" alignSelf="start">
            Total available: {totalPendingAmount ? Number(formatEther(totalPendingAmount)).toFixed(4) : '0'} TRIVIA
          </Text>
          <Text fontSize="xs" color="whiteAlpha.500" alignSelf="start">
            (Includes staked balance and accumulated rewards)
          </Text>
          
          <Button
            w="full"
            colorScheme="purple"
            onClick={() => handleRequestUnstake()}
            isDisabled={!address || isLoading || !stakedBalance || stakedBalance === 0n}
            isLoading={isLoading}
            loadingText="Processing..."
          >
            Unstake
          </Button>
          
          <HStack spacing={2} color="whiteAlpha.600" fontSize="xs">
            <FaClock size="12px" />
            <Text>7-day cooldown period applies after unstaking</Text>
          </HStack>
        </VStack>
      </VStack>
    </FormControl>
  );
} 