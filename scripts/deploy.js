const hre = require("hardhat")
const fs = require("fs")
const path = require("path")

async function main() {
  console.log("Deploying TestDataManager contract...")

  const TestDataManager = await hre.ethers.getContractFactory("TestDataManager")
  const testDataManager = await TestDataManager.deploy()

  // Wait for the deployment transaction to be mined
  await testDataManager.waitForDeployment()

  // Get the contract address
  const deployedAddress = await testDataManager.getAddress()

  console.log(`TestDataManager deployed to: ${deployedAddress}`)
  
  // Update the contract address in the TypeScript file
  updateContractAddress(deployedAddress)
}

function updateContractAddress(address) {
  try {
    // Path to the TypeScript file
    const filePath = path.join(__dirname, '..', 'lib', 'contracts', 'TestDataManager.ts')
    
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8')
    
    // Replace the address placeholder with the actual address
    content = content.replace(
      /export const TEST_DATA_MANAGER_ADDRESS = "0x[a-fA-F0-9]+";/,
      `export const TEST_DATA_MANAGER_ADDRESS = "${address}";`
    )
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content)
    
    console.log(`Contract address updated in ${filePath}`)
  } catch (error) {
    console.error("Failed to update contract address:", error)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
