import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { TriviaToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("TriviaToken", function () {
    let triviaToken: TriviaToken;
    let owner: SignerWithAddress;
    let treasury: SignerWithAddress;
    let presale: SignerWithAddress;
    let liquidityWallet: SignerWithAddress;
    let airdropWallet: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;
    let addrs: SignerWithAddress[];

    beforeEach(async function () {
        [owner, presale, treasury, liquidityWallet, airdropWallet, addr1, addr2, ...addrs] = await ethers.getSigners();
        
        const TriviaToken = await ethers.getContractFactory("TriviaToken");
        triviaToken = await TriviaToken.deploy(
            presale.address,
            treasury.address,
            liquidityWallet.address,
            airdropWallet.address
        );
        await triviaToken.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await triviaToken.owner()).to.equal(owner.address);
        });

        it("Should distribute tokens correctly", async function () {
            const totalSupply = await triviaToken.totalSupply();
            const presaleBalance = await triviaToken.balanceOf(presale.address);
            const treasuryBalance = await triviaToken.balanceOf(treasury.address);
            const liquidityBalance = await triviaToken.balanceOf(liquidityWallet.address);
            const airdropBalance = await triviaToken.balanceOf(airdropWallet.address);
            const contractBalance = await triviaToken.balanceOf(await triviaToken.getAddress());

            // Check initial distribution
            expect(presaleBalance).to.equal(ethers.parseEther("200000000")); // 20% initial presale
            expect(treasuryBalance).to.equal(ethers.parseEther("250000000")); // 25% marketing/buyback
            expect(liquidityBalance).to.equal(ethers.parseEther("100000000")); // 10% DEX liquidity
            expect(airdropBalance).to.equal(ethers.parseEther("100000000")); // 10% airdrops
            expect(contractBalance).to.equal(ethers.parseEther("100000000")); // 10% staking rewards

            // Total minted should be 75% (750M tokens)
            const expectedInitialSupply = ethers.parseEther("750000000");
            expect(totalSupply).to.equal(expectedInitialSupply);
        });
    });

    describe("Transfers", function () {
        beforeEach(async function () {
            // Transfer some tokens from treasury to addr1
            await triviaToken.connect(treasury).transfer(addr1.address, ethers.parseEther("1000"));
        });

        it("Should transfer tokens with tax", async function () {
            const transferAmount = ethers.parseEther("100");
            const expectedTax = (transferAmount * 200n) / 10000n; // 2% tax
            const expectedTransfer = transferAmount - expectedTax;

            await expect(triviaToken.connect(addr1).transfer(addr2.address, transferAmount))
                .to.changeTokenBalances(
                    triviaToken,
                    [addr1, addr2, treasury],
                    [-transferAmount, expectedTransfer, expectedTax]
                );
        });
    });

    describe("Staking", function () {
        beforeEach(async function () {
            await triviaToken.connect(treasury).transfer(addr1.address, ethers.parseEther("1000"));
        });

        it("Should allow staking tokens", async function () {
            const stakeAmount = ethers.parseEther("100");
            await triviaToken.connect(addr1).approve(await triviaToken.getAddress(), stakeAmount);
            await triviaToken.connect(addr1).stake(stakeAmount);
            
            expect(await triviaToken.getStakedBalance(addr1.address)).to.equal(stakeAmount);
        });

        it("Should calculate correct rewards", async function () {
            // Transfer tokens first
            await triviaToken.connect(treasury).transfer(addr1.address, ethers.parseEther("1000"));
            
            // Then stake
            const stakeAmount = ethers.parseEther("1000");
            await triviaToken.connect(addr1).stake(stakeAmount);

            // Move forward 30 days
            await time.increase(30 * 24 * 60 * 60);

            // Calculate expected rewards (400% APY for first 30 days)
            const expectedRewards = (stakeAmount * 40000n * 30n) / (365n * 10000n);
            const actualRewards = await triviaToken.calculatePendingRewards(addr1.address);
            
            expect(actualRewards).to.be.closeTo(expectedRewards, ethers.parseEther("0.1"));
        });
    });

    describe("Rewards", function () {
        it("Should lock rewards for 7 days", async function () {
            const rewardAmount = ethers.parseEther("10");
            await triviaToken.rewardUser(addr1.address, rewardAmount);

            // Try to transfer immediately
            await expect(
                triviaToken.connect(addr1).transfer(addr2.address, rewardAmount)
            ).to.be.revertedWith("Tokens are locked");

            // Move forward 7 days
            await time.increase(7 * 24 * 60 * 60);

            // Transfer should now succeed
            await expect(
                triviaToken.connect(addr1).transfer(addr2.address, rewardAmount)
            ).to.not.be.reverted;
        });
    });

    describe("Server Access", function () {
        beforeEach(async function () {
            // Give addr1 enough tokens for testing
            await triviaToken.connect(treasury).transfer(addr1.address, ethers.parseEther("200000"));
        });

        it("Should grant server access when staking requirement met", async function () {
            // Stake 100k tokens (requirement amount)
            await triviaToken.connect(addr1).approve(await triviaToken.getAddress(), ethers.parseEther("100000"));
            await triviaToken.connect(addr1).stake(ethers.parseEther("100000"));
            
            expect(await triviaToken.hasServerAccess(addr1.address)).to.be.true;
        });

        it("Should deny server access when stake is insufficient", async function () {
            // Stake 99k tokens (below requirement)
            await triviaToken.connect(addr1).approve(await triviaToken.getAddress(), ethers.parseEther("99000"));
            await triviaToken.connect(addr1).stake(ethers.parseEther("99000"));
            
            expect(await triviaToken.hasServerAccess(addr1.address)).to.be.false;
        });

        it("Should revoke server access after partial unstake", async function () {
            // First stake enough
            await triviaToken.connect(addr1).approve(await triviaToken.getAddress(), ethers.parseEther("150000"));
            await triviaToken.connect(addr1).stake(ethers.parseEther("150000"));
            expect(await triviaToken.hasServerAccess(addr1.address)).to.be.true;

            // Then unstake some, going below requirement
            await triviaToken.connect(addr1).unstake(ethers.parseEther("60000"));
            expect(await triviaToken.hasServerAccess(addr1.address)).to.be.false;
        });
    });

    describe("Edge Cases", function () {
        beforeEach(async function () {
            await triviaToken.connect(treasury).transfer(addr1.address, ethers.parseEther("1000"));
        });

        it("Should not allow staking more than balance", async function () {
            const balance = await triviaToken.balanceOf(addr1.address);
            await triviaToken.connect(addr1).approve(await triviaToken.getAddress(), balance + 1n);
            await expect(
                triviaToken.connect(addr1).stake(balance + 1n)
            ).to.be.revertedWith("Insufficient balance");
        });

        it("Should not allow unstaking more than staked", async function () {
            const stakeAmount = ethers.parseEther("500");
            await triviaToken.connect(addr1).approve(await triviaToken.getAddress(), stakeAmount);
            await triviaToken.connect(addr1).stake(stakeAmount);
            await expect(
                triviaToken.connect(addr1).unstake(stakeAmount + 1n)
            ).to.be.revertedWith("Insufficient staked balance");
        });

        it("Should handle multiple stake/unstake operations correctly", async function () {
            // Stake in multiple operations
            await triviaToken.connect(addr1).approve(await triviaToken.getAddress(), ethers.parseEther("500"));
            await triviaToken.connect(addr1).stake(ethers.parseEther("300"));
            await triviaToken.connect(addr1).stake(ethers.parseEther("200"));
            
            expect(await triviaToken.getStakedBalance(addr1.address))
                .to.equal(ethers.parseEther("500"));

            // Unstake partially
            await triviaToken.connect(addr1).unstake(ethers.parseEther("200"));
            
            expect(await triviaToken.getStakedBalance(addr1.address))
                .to.equal(ethers.parseEther("300"));
        });

        it("Should calculate rewards correctly after multiple stakes", async function () {
            // Transfer tokens first
            await triviaToken.connect(treasury).transfer(addr1.address, ethers.parseEther("500"));
            
            // Initial stake of 300 tokens
            await triviaToken.connect(addr1).stake(ethers.parseEther("300"));
            
            // Move forward 15 days
            await time.increase(15 * 24 * 60 * 60);
            
            // Get and verify first period rewards
            const firstPeriodRewards = await triviaToken.calculatePendingRewards(addr1.address);
            const expectedFirstPeriod = (ethers.parseEther("300") * 40000n * 15n) / (365n * 10000n);
            expect(firstPeriodRewards).to.be.closeTo(expectedFirstPeriod, ethers.parseEther("0.1"));
            
            // Stake additional 200 tokens
            await triviaToken.connect(addr1).stake(ethers.parseEther("200"));
            
            // Move forward another 15 days
            await time.increase(15 * 24 * 60 * 60);
            
            // Get and verify second period rewards
            const secondPeriodRewards = await triviaToken.calculatePendingRewards(addr1.address);
            const expectedSecondPeriod = (ethers.parseEther("500") * 40000n * 15n) / (365n * 10000n);
            expect(secondPeriodRewards).to.be.closeTo(expectedSecondPeriod, ethers.parseEther("0.1"));
        });
    });

    describe("Presale Vesting", function () {
        it("Should release tokens according to vesting schedule", async function () {
            // Check initial release (20%)
            const firstRelease = ethers.parseEther("200000000"); // 200M tokens
            expect(await triviaToken.balanceOf(presale.address)).to.equal(firstRelease);

            // Move to day 31 and release second batch
            await time.increase(31 * 24 * 60 * 60);
            await triviaToken.releaseVestedTokens();
            
            const secondRelease = ethers.parseEther("125000000"); // 125M tokens
            expect(await triviaToken.balanceOf(presale.address))
                .to.equal(firstRelease + secondRelease);

            // Move to day 61 and release final batch
            await time.increase(30 * 24 * 60 * 60);
            await triviaToken.releaseVestedTokens();
            
            const thirdRelease = ethers.parseEther("125000000"); // 125M tokens
            expect(await triviaToken.balanceOf(presale.address))
                .to.equal(firstRelease + secondRelease + thirdRelease);
        });

        it("Should not allow early release of tokens", async function () {
            // Move to day 15 (before second release)
            await time.increase(15 * 24 * 60 * 60);
            await triviaToken.releaseVestedTokens();
            
            // Balance should still be only first release
            expect(await triviaToken.balanceOf(presale.address))
                .to.equal(ethers.parseEther("200000000"));
        });

        it("Should not release tokens twice", async function () {
            // Move to day 31 and release second batch
            await time.increase(31 * 24 * 60 * 60);
            await triviaToken.releaseVestedTokens();
            
            // Try to release again
            await triviaToken.releaseVestedTokens();
            
            // Balance should still be first + second release only
            expect(await triviaToken.balanceOf(presale.address))
                .to.equal(ethers.parseEther("325000000")); // 200M + 125M
        });

        it("Should emit VestingReleased events", async function () {
            // Move to day 31
            await time.increase(31 * 24 * 60 * 60);
            
            await expect(triviaToken.releaseVestedTokens())
                .to.emit(triviaToken, "VestingReleased")
                .withArgs(2, ethers.parseEther("125000000"));

            // Move to day 61
            await time.increase(30 * 24 * 60 * 60);
            
            await expect(triviaToken.releaseVestedTokens())
                .to.emit(triviaToken, "VestingReleased")
                .withArgs(3, ethers.parseEther("125000000"));
        });

        it("Should only allow owner to release tokens", async function () {
            await time.increase(31 * 24 * 60 * 60);
            
            await expect(
                triviaToken.connect(addr1).releaseVestedTokens()
            ).to.be.revertedWithCustomError(triviaToken, "OwnableUnauthorizedAccount");
        });

        it("Should allocate correct initial token distribution", async function () {
            const totalSupply = await triviaToken.totalSupply();
            const presaleBalance = await triviaToken.balanceOf(presale.address);
            const treasuryBalance = await triviaToken.balanceOf(treasury.address);
            const liquidityBalance = await triviaToken.balanceOf(liquidityWallet.address);
            const airdropBalance = await triviaToken.balanceOf(airdropWallet.address);
            const contractBalance = await triviaToken.balanceOf(await triviaToken.getAddress());

            // Check initial distribution
            expect(presaleBalance).to.equal(ethers.parseEther("200000000")); // 20% initial presale
            expect(treasuryBalance).to.equal(ethers.parseEther("250000000")); // 25% marketing/buyback
            expect(liquidityBalance).to.equal(ethers.parseEther("100000000")); // 10% DEX liquidity
            expect(airdropBalance).to.equal(ethers.parseEther("100000000")); // 10% airdrops
            expect(contractBalance).to.equal(ethers.parseEther("100000000")); // 10% staking rewards

            // Total minted should be 75% (750M tokens)
            const expectedInitialSupply = ethers.parseEther("750000000");
            expect(totalSupply).to.equal(expectedInitialSupply);
        });
    });

    describe("Staking Rewards", function () {
        beforeEach(async function () {
            // Give addr1 tokens for testing (accounting for 2% tax)
            const transferAmount = ethers.parseEther("102041"); // ~100k after 2% tax
            await triviaToken.connect(treasury).transfer(addr1.address, transferAmount);
            // Approve tokens for staking
            await triviaToken.connect(addr1).approve(await triviaToken.getAddress(), ethers.parseEther("100000"));
        });

        it("Should calculate daily rewards correctly for different APY periods", async function () {
            const stakeAmount = ethers.parseEther("100000"); // 100k tokens
            await triviaToken.connect(addr1).stake(stakeAmount);

            // Test initial APY period (400%)
            await time.increase(24 * 60 * 60); // 1 day
            let dailyRewards = await triviaToken.calculatePendingRewards(addr1.address);
            // Daily rate = 400% / 365 = ~1.0959% per day
            let expectedDailyRewards = (stakeAmount * 40000n) / (365n * 10000n); // 400% APY
            expect(dailyRewards).to.be.closeTo(expectedDailyRewards, ethers.parseEther("0.1"));

            // Test middle APY period (250%)
            await time.increase(90 * 24 * 60 * 60); // Move to day 91
            await triviaToken.connect(addr1).claimRewards(); // Claim rewards and reset timestamp
            await time.increase(24 * 60 * 60); // 1 more day
            dailyRewards = await triviaToken.calculatePendingRewards(addr1.address);
            // Daily rate = 250% / 365 = ~0.6849% per day
            expectedDailyRewards = (stakeAmount * 25000n) / (365n * 10000n); // 250% APY
            expect(dailyRewards).to.be.closeTo(expectedDailyRewards, ethers.parseEther("0.1"));

            // Test final APY period (200%)
            await time.increase(90 * 24 * 60 * 60); // Move to day 181
            await triviaToken.connect(addr1).claimRewards(); // Claim rewards and reset timestamp
            await time.increase(24 * 60 * 60); // 1 more day
            dailyRewards = await triviaToken.calculatePendingRewards(addr1.address);
            // Daily rate = 200% / 365 = ~0.5479% per day
            expectedDailyRewards = (stakeAmount * 20000n) / (365n * 10000n); // 200% APY
            expect(dailyRewards).to.be.closeTo(expectedDailyRewards, ethers.parseEther("0.1"));
        });

        it("Should accumulate and claim rewards correctly over multiple days", async function () {
            const stakeAmount = ethers.parseEther("100000"); // 100k tokens
            await triviaToken.connect(addr1).stake(stakeAmount);

            // Let 10 days pass
            await time.increase(10 * 24 * 60 * 60);

            // Calculate expected 10-day rewards at 400% APY
            const tenDayRewards = (stakeAmount * 40000n * 10n) / (365n * 10000n);
            const actualRewards = await triviaToken.calculatePendingRewards(addr1.address);
            expect(actualRewards).to.be.closeTo(tenDayRewards, ethers.parseEther("0.1"));

            // Verify balance before and after claiming
            const balanceBefore = await triviaToken.balanceOf(addr1.address);
            await triviaToken.connect(addr1).claimRewards();
            const balanceAfter = await triviaToken.balanceOf(addr1.address);
            
            expect(balanceAfter - balanceBefore).to.be.closeTo(tenDayRewards, ethers.parseEther("0.1"));
        });

        it("Should handle reward calculations across APY change boundaries", async function () {
            const stakeAmount = ethers.parseEther("100000"); // 100k tokens
            await triviaToken.connect(addr1).stake(stakeAmount);

            // Move to just before APY change (day 89)
            await time.increase(89 * 24 * 60 * 60);
            
            // Calculate rewards for the first period (400% APY)
            const firstPeriodRewards = await triviaToken.calculatePendingRewards(addr1.address);
            const expected89DayRewards = (stakeAmount * 40000n * 89n) / (365n * 10000n);
            expect(firstPeriodRewards).to.be.closeTo(expected89DayRewards, ethers.parseEther("0.1"));

            // Claim rewards to reset the timestamp
            await triviaToken.connect(addr1).claimRewards();

            // Move 2 days into the second period (250% APY)
            await time.increase(2 * 24 * 60 * 60);
            
            // Calculate rewards for just the second period
            const secondPeriodRewards = await triviaToken.calculatePendingRewards(addr1.address);
            const expected2DayRewards = (stakeAmount * 25000n * 2n) / (365n * 10000n);
            expect(secondPeriodRewards).to.be.closeTo(expected2DayRewards, ethers.parseEther("0.1"));
        });
    });
}); 