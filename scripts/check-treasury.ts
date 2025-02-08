import { ethers } from "hardhat";
import { formatEther } from "ethers";

async function main() {
  const TREASURY_ADDRESS = "0x728f61E701b067bA7Bf3b0Ed795935a32976e6b5";
  const CONTRACT_ADDRESS = "0xEaD61BC4b3bE36FbD6E5887800F30b8Ee68e6D84";
  
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