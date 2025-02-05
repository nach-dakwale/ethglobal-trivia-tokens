import { ethers } from "hardhat";
import { run } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying TriviaToken with account:", deployer.address);

  // Using deployer address for all wallets in development
  // In production, these should be different secure addresses
  const presaleWallet = deployer.address;
  const treasuryWallet = deployer.address;
  const liquidityWallet = deployer.address;
  const airdropWallet = deployer.address;

  const TriviaToken = await ethers.getContractFactory("TriviaToken");
  const triviaToken = await TriviaToken.deploy(
    presaleWallet,
    treasuryWallet,
    liquidityWallet,
    airdropWallet
  );

  await triviaToken.waitForDeployment();

  const tokenAddress = await triviaToken.getAddress();
  console.log("TriviaToken deployed to:", tokenAddress);
  console.log("Constructor Arguments:");
  console.log("- Presale Wallet:", presaleWallet);
  console.log("- Treasury Wallet:", treasuryWallet);
  console.log("- Liquidity Wallet:", liquidityWallet);
  console.log("- Airdrop Wallet:", airdropWallet);

  // Verify the contract on Etherscan
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for 6 block confirmations...");
    await triviaToken.deploymentTransaction()?.wait(6);
    
    console.log("Verifying contract on Etherscan...");
    await run("verify:verify", {
      address: tokenAddress,
      constructorArguments: [
        presaleWallet,
        treasuryWallet,
        liquidityWallet,
        airdropWallet
      ],
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 