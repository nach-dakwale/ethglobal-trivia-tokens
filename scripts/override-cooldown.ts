import { ethers } from "hardhat";

async function main() {
  const userAddress = "0x1402D4103A873650B7DF3d44f23436663A3e307c";
  
  // Get the contract instance
  const triviaToken = await ethers.getContractAt(
    "TriviaToken",
    "0x13250D67E38Ff5B89667627c612F0f72B50347dE"
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