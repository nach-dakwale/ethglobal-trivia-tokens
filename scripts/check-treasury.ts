import { ethers } from "hardhat";
import { formatEther } from "ethers";

async function main() {
  const TREASURY_ADDRESS = "0x1402D4103A873650B7DF3d44f23436663A3e307c";
  const CONTRACT_ADDRESS = "0x13250D67E38Ff5B89667627c612F0f72B50347dE";
  
  // Get the contract instance
  const triviaToken = await ethers.getContractAt(
    "TriviaToken",
    CONTRACT_ADDRESS
  );

  // Get treasury balance
  const balance = await triviaToken.balanceOf(TREASURY_ADDRESS);
  console.log("Treasury Balance:", formatEther(balance), "TRIVIA");

  // Get tax rate
  const taxRate = await triviaToken.TAX_RATE();
  console.log("Current Tax Rate:", Number(taxRate) / 100, "%");

  // Get recent transfers to treasury (tax collections)
  const filter = triviaToken.filters.Transfer(undefined, TREASURY_ADDRESS);
  const events = await triviaToken.queryFilter(filter, -1000); // Last 1000 blocks

  console.log("\nRecent Transfers to Treasury:");
  for (const event of events) {
    if (event.args[0] !== ethers.ZeroAddress) { // Filter out zero address transfers
      const amount = formatEther(event.args[2]);
      const from = event.args[0];
      const block = await event.getBlock();
      const timestamp = new Date(Number(block.timestamp) * 1000);
      
      console.log(`Time: ${timestamp.toLocaleString()}`);
      console.log(`From: ${from}`);
      console.log(`Amount: ${amount} TRIVIA`);
      console.log("---");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 