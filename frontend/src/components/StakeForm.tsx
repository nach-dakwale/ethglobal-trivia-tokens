import { FormControl, FormLabel, Input, Button, useToast, VStack, Text, HStack } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain, useWaitForTransactionReceipt, useWriteContract, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { TRIVIA_TOKEN_ADDRESS, TRIVIA_TOKEN_ABI } from '../constants';
import { FaCheckCircle } from 'react-icons/fa';

export function StakeForm() {
  const [amount, setAmount] = useState<string>('');
  const [isApproving, setIsApproving] = useState(false);
  const { writeContract, data: hash, status, error } = useWriteContract();
  const { data: receipt, isLoading: isWaitingForTransaction } = useWaitForTransactionReceipt({ hash });
  const { address } = useAccount();
  const toast = useToast();

  // Check allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: TRIVIA_TOKEN_ADDRESS as `0x${string}`,
    abi: TRIVIA_TOKEN_ABI,
    functionName: 'allowance',
    args: address ? [address, TRIVIA_TOKEN_ADDRESS as `0x${string}`] : undefined,
  });

  // Handle transaction status changes
  useEffect(() => {
    if (status === 'success' && hash) {
      if (isApproving) {
        // Wait for the transaction to be mined before updating UI
        toast({
          title: 'Approval Pending',
          description: 'Please wait for the approval transaction to be confirmed.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      } else {
        // Show success message for staking
        toast({
          title: 'Staking Successful',
          description: 'Your tokens have been staked successfully!',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Clear the input
        setAmount('');
      }
    } else if (status === 'error') {
      console.error('Transaction failed:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Transaction failed',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsApproving(false);
    }
  }, [status, hash, error, isApproving, toast]);

  // Add effect for handling transaction receipt
  useEffect(() => {
    if (receipt) {
      if (isApproving) {
        // Only show approval success and update state after transaction is confirmed
        toast({
          title: 'Approval Successful',
          description: 'You can now stake your tokens.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setIsApproving(false);
        refetchAllowance();
      } else {
        // Refresh the staking stats after successful stake
        if (typeof window !== 'undefined' && (window as any).refetchStakingStats) {
          (window as any).refetchStakingStats();
        }
      }
    }
  }, [receipt, isApproving, toast, refetchAllowance]);

  const handleApprove = async () => {
    if (!amount || !address) return;
    
    setIsApproving(true);
    try {
      const amountToApprove = parseEther(amount);
      writeContract({
        address: TRIVIA_TOKEN_ADDRESS as `0x${string}`,
        abi: TRIVIA_TOKEN_ABI,
        functionName: 'approve',
        args: [TRIVIA_TOKEN_ADDRESS as `0x${string}`, amountToApprove],
        gas: BigInt(300000),
      });
    } catch (err) {
      console.error('Approval error:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to approve tokens',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsApproving(false);
    }
  };

  const handleStake = async () => {
    if (!amount || !address) return;

    try {
      const amountToStake = parseEther(amount);
      
      if (!allowance || (typeof allowance === 'bigint' && allowance < amountToStake)) {
        toast({
          title: 'Approval Required',
          description: 'Please approve the tokens before staking.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      writeContract({
        address: TRIVIA_TOKEN_ADDRESS as `0x${string}`,
        abi: TRIVIA_TOKEN_ABI,
        functionName: 'stake',
        args: [amountToStake],
        gas: BigInt(300000),
      });
    } catch (err) {
      console.error('Staking error:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to stake tokens',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const needsApproval = !allowance || (typeof allowance === 'bigint' && amount && allowance < parseEther(amount));
  const isLoading = isApproving || status === 'pending' || isWaitingForTransaction;
  const isButtonDisabled = !amount || !address || isLoading;

  return (
    <FormControl>
      <FormLabel color="whiteAlpha.700">Stake Amount</FormLabel>
      <VStack spacing={4}>
        <Input
          type="number"
          value={amount}
          onChange={handleAmountChange}
          placeholder="Enter amount to stake"
          color="whiteAlpha.900"
          _placeholder={{ color: 'whiteAlpha.400' }}
          min="0"
          step="any"
        />
        
        <VStack spacing={2} w="full">
          {!needsApproval && amount && (
            <HStack w="full" spacing={2}>
              <FaCheckCircle color="green" />
              <Text color="green.300" fontSize="sm">
                Tokens approved for staking
              </Text>
            </HStack>
          )}
          
          <Button
            w="full"
            colorScheme="purple"
            onClick={handleApprove}
            isDisabled={!needsApproval || isButtonDisabled}
            isLoading={isApproving}
            loadingText="Approving..."
            variant={needsApproval ? "solid" : "outline"}
          >
            Approve
          </Button>
          
          <Button
            w="full"
            colorScheme="purple"
            onClick={handleStake}
            isDisabled={needsApproval || isButtonDisabled}
            isLoading={status === 'pending' && !isApproving}
            loadingText="Staking..."
            variant={!needsApproval ? "solid" : "outline"}
          >
            Stake
          </Button>
        </VStack>
      </VStack>
    </FormControl>
  );
} 