import hre from "hardhat";

async function main() {
  console.log("🚀 Deploying RallyLeaderboard to", hre.network.name, "...");
  
  const RallyLeaderboard = await hre.ethers.getContractFactory("RallyLeaderboard");
  const leaderboard = await RallyLeaderboard.deploy();
  await leaderboard.waitForDeployment();
  
  const address = await leaderboard.getAddress();
  console.log("");
  console.log("✅ RallyLeaderboard deployed!");
  console.log("📍 Contract address:", address);
  console.log("");
  console.log("👉 Next step: Copy the address above and paste it into");
  console.log("   src/web3/wallet.js → LEADERBOARD_ADDRESS");
  console.log("");
  console.log("🔍 View on Etherscan:");
  console.log(`   https://sepolia.etherscan.io/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
