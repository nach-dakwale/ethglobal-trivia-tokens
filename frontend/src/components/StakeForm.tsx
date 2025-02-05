import { FormControl, FormLabel, Input, Button, useToast, VStack } from '@chakra-ui/react';
import { useState } from 'react';
import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { TRIVIA_TOKEN_ADDRESS, TRIVIA_TOKEN_ABI } from '../constants';

export function StakeForm() {
  const [amount, setAmount] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const { writeContract } = useWriteContract();
  const { address } = useAccount();
  const toast = useToast();

  // Check allowance
  const { data: allowance } = useReadContract({
    address: TRIVIA_TOKEN_ADDRESS,
    abi: TRIVIA_TOKEN_ABI,
    functionName: 'allowance',
    args: [address, TRIVIA_TOKEN_ADDRESS],
  }) as { data: bigint };

  const handleApprove = async () => {
    if (!amount) return;
    
    setIsApproving(true);
    try {
      await writeContract({
        address: TRIVIA_TOKEN_ADDRESS,
        abi: TRIVIA_TOKEN_ABI,
        functionName: 'approve',
        args: [TRIVIA_TOKEN_ADDRESS, parseEther(amount)],
      });

      toast({
        title: 'Success',
        description: 'Token approval successful',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to approve tokens',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleStake = async () => {
    if (!amount) return;

    try {
      const amountToStake = parseEther(amount);
      
      // Check if approval is needed
      if (!allowance || allowance < amountToStake) {
        await handleApprove();
        return;
      }

      await writeContract({
        address: TRIVIA_TOKEN_ADDRESS,
        abi: TRIVIA_TOKEN_ABI,
        functionName: 'stake',
        args: [amountToStake],
      });

      toast({
        title: 'Success',
        description: `Successfully staked ${amount} TRIVIA tokens`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setAmount('');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to stake tokens',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <FormControl>
      <FormLabel color="whiteAlpha.700">Stake Amount</FormLabel>
      <VStack spacing={2}>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount to stake"
          color="whiteAlpha.900"
          _placeholder={{ color: 'whiteAlpha.400' }}
        />
        <Button
          w="full"
          colorScheme="purple"
          onClick={handleStake}
          isDisabled={!amount}
          isLoading={isApproving}
          loadingText="Approving..."
        >
          {(!allowance || (amount && allowance < parseEther(amount))) ? 'Approve' : 'Stake'}
        </Button>
      </VStack>
    </FormControl>
  );
} 