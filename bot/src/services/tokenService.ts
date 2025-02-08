import { ethers } from 'ethers';
import { CONFIG } from '../config';
import { getUserWallet } from '../db/users';

const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
const wallet = new ethers.Wallet(CONFIG.PRIVATE_KEY, provider);

const contractABI = [
  "function transferWithoutTax(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)"
];

const contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, contractABI, wallet);

export async function rewardUser(discordId: string, amount: number) {
  try {
    // Get user's registered wallet
    const userWallet = await getUserWallet(discordId);
    if (!userWallet) {
      throw new Error('User wallet not registered');
    }

    // Convert amount to wei (18 decimals)
    const rewardAmount = ethers.parseUnits(amount.toString(), 18);

    // Send reward using tax-exempt transfer
    const tx = await contract.transferWithoutTax(userWallet, rewardAmount);
    await tx.wait();

    return true;
  } catch (error) {
    console.error('Error rewarding user:', error);
    throw error;
  }
}

export async function getBalance(address: string): Promise<string> {
  try {
    const balance = await contract.balanceOf(address);
    return ethers.formatUnits(balance, 18);
  } catch (error) {
    console.error('Error getting balance:', error);
    throw error;
  }
}