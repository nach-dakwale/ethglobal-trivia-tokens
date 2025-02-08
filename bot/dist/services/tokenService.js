"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewardUser = rewardUser;
exports.getBalance = getBalance;
const ethers_1 = require("ethers");
const config_1 = require("../config");
const users_1 = require("../db/users");
const provider = new ethers_1.ethers.JsonRpcProvider(config_1.CONFIG.RPC_URL);
const wallet = new ethers_1.ethers.Wallet(config_1.CONFIG.PRIVATE_KEY, provider);
const contractABI = [
    "function transferWithoutTax(address to, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)"
];
const contract = new ethers_1.ethers.Contract(config_1.CONFIG.CONTRACT_ADDRESS, contractABI, wallet);
async function rewardUser(discordId, amount) {
    try {
        // Get user's registered wallet
        const userWallet = await (0, users_1.getUserWallet)(discordId);
        if (!userWallet) {
            throw new Error('User wallet not registered');
        }
        // Convert amount to wei (18 decimals)
        const rewardAmount = ethers_1.ethers.parseUnits(amount.toString(), 18);
        // Send reward using tax-exempt transfer
        const tx = await contract.transferWithoutTax(userWallet, rewardAmount);
        await tx.wait();
        return true;
    }
    catch (error) {
        console.error('Error rewarding user:', error);
        throw error;
    }
}
async function getBalance(address) {
    try {
        const balance = await contract.balanceOf(address);
        return ethers_1.ethers.formatUnits(balance, 18);
    }
    catch (error) {
        console.error('Error getting balance:', error);
        throw error;
    }
}
