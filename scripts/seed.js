const hre = require("hardhat")

async function main() {
  console.log("Seeding TestDataManager with sample data...")

  // Get the deployed contract
  const TestDataManager = await hre.ethers.getContractFactory("TestDataManager")
  const testDataManager = await TestDataManager.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512") // Replace with your contract address

  // Sample test data
  const testData = [
    {
      testName: "Login Authentication Test",
      testType: "ui",
      passed: true,
      data: JSON.stringify({
        testName: "Login Authentication Test",
        testType: "ui",
        testResult: "pass",
        executionTime: "1250",
        testData: "Test executed successfully. User login validated with correct credentials. Response time: 1.25s",
        timestamp: new Date().toISOString(),
      }),
    },
    {
      testName: "Payment API Integration Test",
      testType: "api",
      passed: false,
      data: JSON.stringify({
        testName: "Payment API Integration Test",
        testType: "api",
        testResult: "fail",
        executionTime: "3200",
        testData:
          "Test failed. Payment API returned error code 500. Expected response: 200 OK. Actual response: 500 Internal Server Error.",
        timestamp: new Date().toISOString(),
      }),
    },
    {
      testName: "User Registration Flow",
      testType: "integration",
      passed: true,
      data: JSON.stringify({
        testName: "User Registration Flow",
        testType: "integration",
        testResult: "pass",
        executionTime: "2100",
        testData:
          "Test passed. User registration completed successfully. Email verification sent. Database record created.",
        timestamp: new Date().toISOString(),
      }),
    },
  ]

  // Add test data to the contract
  for (const test of testData) {
    console.log(`Adding test: ${test.testName}`)
    const tx = await testDataManager.addTestData(test.testName, test.testType, test.passed, test.data)
    await tx.wait()
  }

  console.log("Sample data seeded successfully!")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
