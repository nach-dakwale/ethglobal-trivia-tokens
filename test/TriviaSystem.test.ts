import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import {
  TriviaToken,
  TriviaStaking,
  TriviaTokenTreasury,
} from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Trivia Token System", function () {
  let triviaToken: TriviaToken;
  let triviaStaking: TriviaStaking;
  let treasury: TriviaTokenTreasury;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;
  let stakingAddress: string;
  let treasuryAddress: string;
  let tokenAddress: string;

  const INITIAL_SUPPLY = ethers.parseEther("1000000000"); // 1 billion tokens
  const TAX_BPS = 200n; // 2%
  const LOCK_PERIOD = 7n * 24n * 60n * 60n; // 7 days
  const STAKE_REQUIREMENT = INITIAL_SUPPLY * 1n / 10000n; // 0.01% of supply
  const MIN_WITHDRAW_THRESHOLD = ethers.parseEther("1000"); // 1000 tokens

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy Treasury first
    const Treasury = await ethers.getContractFactory("TriviaTokenTreasury");
    treasury = await Treasury.deploy(MIN_WITHDRAW_THRESHOLD);
    await treasury.waitForDeployment();
    treasuryAddress = await treasury.getAddress();

    // Deploy TriviaToken with treasury address
    const TriviaToken = await ethers.getContractFactory("TriviaToken");
    triviaToken = await TriviaToken.deploy(treasuryAddress);
    await triviaToken.waitForDeployment();
    tokenAddress = await triviaToken.getAddress();

    // Initialize treasury with token address
    await treasury.initialize(tokenAddress);

    // Deploy Staking
    const TriviaStaking = await ethers.getContractFactory("TriviaStaking");
    triviaStaking = await TriviaStaking.deploy(tokenAddress);
    await triviaStaking.waitForDeployment();
    stakingAddress = await triviaStaking.getAddress();

    // Setup authorizations
    await treasury.setSourceAuthorization(tokenAddress, true);
    await treasury.setSourceAuthorization(stakingAddress, true);

    // Transfer initial tokens to users and approve staking contract
    const userInitialBalance = ethers.parseEther("100000");
    await triviaToken.transfer(user1.address, userInitialBalance);
    await triviaToken.transfer(user2.address, userInitialBalance);
    await triviaToken.transfer(user3.address, userInitialBalance);

    // Approve staking contract for all users
    await triviaToken.connect(user1).approve(stakingAddress, ethers.MaxUint256);
    await triviaToken.connect(user2).approve(stakingAddress, ethers.MaxUint256);
    await triviaToken.connect(user3).approve(stakingAddress, ethers.MaxUint256);
  });

  describe("Token Tax Calculations", function () {
    it("Should correctly calculate and collect 2% tax on transfers", async function () {
      const transferAmount = ethers.parseEther("1000");
      const expectedTax = (transferAmount * TAX_BPS) / 10000n;
      const expectedReceived = transferAmount - expectedTax;

      await triviaToken.transfer(user1.address, transferAmount);
      
      expect(await triviaToken.balanceOf(user1.address)).to.equal(expectedReceived);
      expect(await triviaToken.balanceOf(treasuryAddress)).to.equal(expectedTax);
    });

    it("Should not charge tax for exempt addresses", async function () {
      const transferAmount = ethers.parseEther("1000");
      
      await triviaToken.setExemption(user1.address, true);
      await triviaToken.transfer(user1.address, transferAmount);
      
      expect(await triviaToken.balanceOf(user1.address)).to.equal(transferAmount);
    });

    it("Should handle zero amount transfers", async function () {
      await expect(
        triviaToken.transfer(user1.address, 0n)
      ).to.be.revertedWith("Transfer amount must be greater than zero");
    });
  });

  describe("Lock Period Enforcement", function () {
    beforeEach(async function () {
      await triviaToken.transfer(user1.address, ethers.parseEther("10000"));
    });

    it("Should enforce lock period on newly received tokens", async function () {
      const transferAmount = ethers.parseEther("1000");
      await triviaToken.transfer(user1.address, transferAmount);
      
      await expect(
        triviaToken.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.revertedWith("Tokens are locked");
    });

    it("Should allow transfer after lock period", async function () {
      await time.increase(LOCK_PERIOD);
      
      await expect(
        triviaToken.connect(user1).transfer(user2.address, ethers.parseEther("1000"))
      ).to.not.be.reverted;
    });
  });

  describe("Staking Requirements", function () {
    it("Should enforce minimum stake requirement for bot activation", async function () {
      const belowMinimum = STAKE_REQUIREMENT - 1n;
      await triviaToken.transfer(user1.address, STAKE_REQUIREMENT);
      await triviaToken.connect(user1).approve(stakingAddress, STAKE_REQUIREMENT);
      
      await expect(
        triviaStaking.connect(user1).stakeForBotActivation(belowMinimum)
      ).to.be.revertedWith("Stake amount below requirement");
    });

    it("Should activate bot access when stake requirement met", async function () {
      await triviaToken.transfer(user1.address, STAKE_REQUIREMENT);
      await triviaToken.connect(user1).approve(stakingAddress, STAKE_REQUIREMENT);
      
      await triviaStaking.connect(user1).stakeForBotActivation(STAKE_REQUIREMENT);
      expect(await triviaStaking.isBotActive(user1.address)).to.be.true;
    });

    it("Should deactivate bot access when stake falls below requirement", async function () {
      const stakeAmount = STAKE_REQUIREMENT * 2n;
      await triviaToken.transfer(user1.address, stakeAmount);
      await triviaToken.connect(user1).approve(stakingAddress, stakeAmount);
      
      await triviaStaking.connect(user1).stakeForBotActivation(stakeAmount);
      await time.increase(LOCK_PERIOD);
      
      // Unstake to below requirement
      await triviaStaking.connect(user1).unstake(STAKE_REQUIREMENT + 1n);
      
      expect(await triviaStaking.isBotActive(user1.address)).to.be.false;
    });
  });

  describe("Treasury Management", function () {
    it("Should accumulate taxes from both token transfers and staking", async function () {
      const transferAmount = ethers.parseEther("10000");
      const stakeAmount = ethers.parseEther("5000");
      
      // Transfer tax
      await triviaToken.transfer(user1.address, transferAmount);
      const transferTax = (transferAmount * TAX_BPS) / 10000n;
      
      // Staking tax
      await triviaToken.connect(user1).approve(stakingAddress, stakeAmount);
      await triviaStaking.connect(user1).stakeForBotActivation(stakeAmount);
      const stakingTax = (stakeAmount * TAX_BPS) / 10000n;
      
      const expectedTotalTax = transferTax + stakingTax;
      expect(await treasury.totalTaxCollected()).to.equal(expectedTotalTax);
    });

    it("Should enforce minimum withdrawal threshold", async function () {
      // First accumulate some tax
      const transferAmount = ethers.parseEther("10000");
      await triviaToken.transfer(user1.address, transferAmount);
      
      await expect(
        treasury.withdrawTax(MIN_WITHDRAW_THRESHOLD - 1n, ethers.ZeroAddress)
      ).to.be.revertedWith("Below withdrawal threshold");
    });

    it("Should track monthly tax collection", async function () {
      const transferAmount = ethers.parseEther("10000");
      await triviaToken.transfer(user1.address, transferAmount);
      
      const currentYear = Math.floor(Date.now() / 31536000000) + 1970;
      const currentMonth = Math.floor((Date.now() % 31536000000) / 2628000000) + 1;
      
      const expectedTax = (transferAmount * TAX_BPS) / 10000n;
      const monthlyTax = await treasury.getMonthlyTaxCollected(currentYear, currentMonth);
      expect(monthlyTax).to.equal(expectedTax);
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle maximum possible transfer amount", async function () {
      await expect(
        triviaToken.transfer(user1.address, INITIAL_SUPPLY + 1n)
      ).to.be.reverted;
    });

    it("Should prevent unauthorized tax collection", async function () {
      await expect(
        treasury.connect(user1).receiveTax(ethers.parseEther("1000"))
      ).to.be.revertedWith("Not authorized");
    });

    it("Should prevent non-owner from modifying exemptions", async function () {
      await expect(
        triviaToken.connect(user1).setExemption(user2.address, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should handle multiple stake/unstake operations correctly", async function () {
      const stakeAmount = STAKE_REQUIREMENT * 2n;
      await triviaToken.transfer(user1.address, stakeAmount);
      await triviaToken.connect(user1).approve(stakingAddress, stakeAmount);
      
      // First stake
      await triviaStaking.connect(user1).stakeForBotActivation(STAKE_REQUIREMENT);
      
      // Second stake
      await triviaStaking.connect(user1).stakeForBotActivation(STAKE_REQUIREMENT);
      
      expect(await triviaStaking.getStakedBalance(user1.address))
        .to.equal(STAKE_REQUIREMENT * 2n * 9800n / 10000n); // Accounting for 2% tax
    });
  });
}); 