import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const oracleAddress = "0xb12C0971D0D25C200D2A2615A00E32a9a752C465"; 

  if (!oracleAddress) {
    console.error("❌ ERROR: Server address (oracle) is not set!");
    process.exit(1);
  }

  const factory = await ethers.getContractFactory("FHEJack");

  console.log("Deploying FHEJack with Oracle:", oracleAddress);
  const contract = await factory.deploy(oracleAddress);

  await contract.waitForDeployment();

  console.log("✅ FHEJack deployed to:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});