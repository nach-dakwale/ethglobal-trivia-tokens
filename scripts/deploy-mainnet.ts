import { ethers } from "hardhat";
import { run } from "hardhat";
import * as dotenv from "dotenv";
import path from "path";

async function main() {
  // Load environment variables from .env.mainnet
  const envPath = path.resolve(process.cwd(), '.env.mainnet');
  const env = dotenv.config({ path: envPath }).parsed;
  if (!env) throw new Error("Could not load .env.mainnet file");

  // Get network to ensure we're on mainnet
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 8453n) {
    throw new Error(`Must be on Base mainnet (chainId: 8453). Current network: ${network.chainId}`);
  }

  const [deployer] = await ethers.getSigners();
  console.log("Deploying TriviaToken with account:", deployer.address);

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceInEth = ethers.formatEther(balance);
  console.log("Deployer balance:", balanceInEth, "ETH");

  if (balance < ethers.parseEther("0.0001")) {
    throw new Error("Insufficient balance for deployment. Need at least 0.0001 ETH for gas fees");
  }

  // Get wallet addresses from environment
  const presaleWallet = env.PRESALE_WALLET;
  const treasuryWallet = env.TREASURY_WALLET;
  const liquidityWallet = env.LIQUIDITY_WALLET;
  const airdropWallet = env.AIRDROP_WALLET;

  // Validate all required addresses
  if (!presaleWallet || !treasuryWallet || !liquidityWallet || !airdropWallet) {
    throw new Error("Missing required wallet addresses in environment variables");
  }

  // Validate addresses are valid
  [presaleWallet, treasuryWallet, liquidityWallet, airdropWallet].forEach(addr => {
    if (!ethers.isAddress(addr)) {
      throw new Error(`Invalid address: ${addr}`);
    }
  });

  console.log("\nDeployment Configuration:");
  console.log("------------------------");
  console.log("Network:", network.name);
  console.log("Chain ID:", network.chainId.toString());
  console.log("Presale Wallet:", presaleWallet);
  console.log("Treasury Wallet:", treasuryWallet);
  console.log("Liquidity Wallet:", liquidityWallet);
  console.log("Airdrop Wallet:", airdropWallet);

  // Prompt for confirmation
  console.log("\n⚠️  ATTENTION ⚠️");
  console.log("This is a mainnet deployment. Please verify the above configuration.");
  console.log("Waiting 20 seconds before deployment...");
  await new Promise(resolve => setTimeout(resolve, 20000));

  const TriviaToken = await ethers.getContractFactory("TriviaToken");
  console.log("\nDeploying TriviaToken...");
  
  const triviaToken = await TriviaToken.deploy(
    presaleWallet,
    treasuryWallet,
    liquidityWallet,
    airdropWallet
  );

  await triviaToken.waitForDeployment();

  const tokenAddress = await triviaToken.getAddress();
  console.log("\nTriviaToken deployed successfully!");
  console.log("--------------------------------");
  console.log("Contract Address:", tokenAddress);

  // Wait for more confirmations on mainnet
  console.log("\nWaiting for 10 block confirmations...");
  await triviaToken.deploymentTransaction()?.wait(10);

  // Verify the contract on Etherscan
  if (env.ETHERSCAN_API_KEY) {
    console.log("\nVerifying contract on Basescan...");
    try {
      await run("verify:verify", {
        address: tokenAddress,
        constructorArguments: [
          presaleWallet,
          treasuryWallet,
          liquidityWallet,
          airdropWallet
        ],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.error("Error verifying contract:", error);
      console.log("You may need to verify manually on Basescan");
    }
  }

  console.log("\n📝 Post-Deployment Steps:");
  console.log("1. Update bot's CONTRACT_ADDRESS in .env");
  console.log("2. Update frontend's TRIVIA_TOKEN_ADDRESS in constants.ts");
  console.log("3. Test token distribution to all wallets");
  console.log("4. Set up initial liquidity pool");
}

main().catch((error) => {
  console.error("\n❌ Deployment failed:", error);
  process.exitCode = 1;
}); 