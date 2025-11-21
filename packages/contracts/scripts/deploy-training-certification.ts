import hre from "hardhat";

const { ethers } = hre;

async function main() {
  console.log("Deploying TrainingCertification contract...");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");

  // Deploy contract
  const TrainingCertificationFactory = await ethers.getContractFactory("TrainingCertification");
  const contract = await TrainingCertificationFactory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("TrainingCertification deployed to:", contractAddress);

  // Verify deployer is admin
  const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
  const hasRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
  console.log("Deployer is admin:", hasRole);

  console.log("\nDeployment complete!");
  console.log("\nNext steps:");
  console.log("1. Verify contract on BaseScan:");
  console.log(`   pnpm hardhat verify --network baseSepolia ${contractAddress}`);
  console.log("2. Grant MINTER_ROLE to authorized addresses:");
  console.log(`   contract.grantRole(MINTER_ROLE, <address>)`);
  console.log("3. Create courses using createCourse()");
  console.log("\nSave this address to your .env:");
  console.log(`TRAINING_CERTIFICATION_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
