import { FormControl, FormLabel, Input, Button, useToast } from '@chakra-ui/react';
import { useState } from 'react';
import { useWriteContract } from 'wagmi';
import { parseEther } from 'viem';
import { TRIVIA_TOKEN_ADDRESS, TRIVIA_TOKEN_ABI } from '../constants';

export function UnstakeForm() {
  const [amount, setAmount] = useState('');
  const { writeContract } = useWriteContract();
  const toast = useToast();

  const handleUnstake = () => {
    if (!amount) return;

    writeContract({
      address: TRIVIA_TOKEN_ADDRESS,
      abi: TRIVIA_TOKEN_ABI,
      functionName: 'unstake',
      args: [parseEther(amount)],
    }, {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: `Successfully unstaked ${amount} TRIVIA tokens`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setAmount('');
      },
    });
  };

  return (
    <FormControl>
      <FormLabel color="whiteAlpha.700">Unstake Amount</FormLabel>
      <Input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter amount to unstake"
        color="whiteAlpha.900"
        _placeholder={{ color: 'whiteAlpha.400' }}
      />
      <Button
        mt={2}
        w="full"
        colorScheme="purple"
        variant="outline"
        onClick={handleUnstake}
        isDisabled={!amount}
      >
        Unstake
      </Button>
    </FormControl>
  );
} 