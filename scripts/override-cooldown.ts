import { ethers } from "hardhat";

async function main() {
  const userAddress = "0x728f61E701b067bA7Bf3b0Ed795935a32976e6b5";
  
  // Get the contract instance
  const triviaToken = await ethers.getContractAt(
    "TriviaToken",
    "0xEaD61BC4b3bE36FbD6E5887800F30b8Ee68e6D84"
  );

  console.log("Setting cooldown override for address:", userAddress);
  
  // Set the override
  const tx = await triviaToken.setCooldownOverride(userAddress, true);
  await tx.wait();
  
  console.log("Successfully set cooldown override");
  
  // Verify the override was set
  const hasOverride = await triviaToken.hasCooldownOverride(userAddress);
  console.log("Override status:", hasOverride);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 