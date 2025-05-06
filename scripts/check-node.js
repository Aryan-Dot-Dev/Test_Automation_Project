// Check if Hardhat node is running and contract is deployed
const { ethers } = require("ethers");
const TestDataManagerABI = require("../artifacts/contracts/TestDataManager.sol/TestDataManager.json");

async function main() {
  try {
    console.log("Checking Hardhat node status...");
    
    // Connect to local Hardhat node
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    
    // Check if connected
    const blockNumber = await provider.getBlockNumber();
    console.log(`✅ Connected to Hardhat node. Current block number: ${blockNumber}`);
    
    // Get network info
    const network = await provider.getNetwork();
    console.log(`Network Name: ${network.name}`);
    console.log(`Chain ID: ${network.chainId}`);
    
    // Try to connect to the contract
    const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    const contract = new ethers.Contract(contractAddress, TestDataManagerABI.abi, provider);
    
    try {
      // Try to call a read method on the contract
      const testDataCount = await contract.getTestDataCount();
      console.log(`✅ Contract verified at ${contractAddress}`);
      console.log(`Current test data count: ${testDataCount}`);
    } catch (contractError) {
      console.error("❌ Contract verification failed. The contract might not be deployed at the expected address:", contractError.message);
      console.log("\nTo deploy the contract, run:");
      console.log("npx hardhat run scripts/deploy.js --network localhost");
    }
    
  } catch (error) {
    console.error("❌ Error connecting to Hardhat node:", error.message);
    console.log("\nPlease start the Hardhat node with:");
    console.log("npx hardhat node");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });