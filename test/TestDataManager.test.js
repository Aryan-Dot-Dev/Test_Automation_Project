const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("TestDataManager", () => {
  let testDataManager
  let owner
  let addr1
  let addr2

  beforeEach(async () => {
    // Get signers
    ;[owner, addr1, addr2] = await ethers.getSigners()

    // Deploy the contract
    const TestDataManager = await ethers.getContractFactory("TestDataManager")
    testDataManager = await TestDataManager.deploy()
    await testDataManager.deployed()
  })

  describe("Adding test data", () => {
    it("Should add test data and emit an event", async () => {
      const testName = "Login Test"
      const testType = "UI"
      const passed = true
      const data = JSON.stringify({
        testName: "Login Test",
        testType: "UI",
        testResult: "pass",
        executionTime: "1500",
        testData: "Test executed successfully",
      })

      // Add test data
      await expect(testDataManager.addTestData(testName, testType, passed, data))
        .to.emit(testDataManager, "TestDataAdded")
        .withArgs(0, owner.address, testName, passed)

      // Check test data count
      expect(await testDataManager.getTestDataCount()).to.equal(1)
    })

    it("Should store test data correctly", async () => {
      const testName = "API Test"
      const testType = "API"
      const passed = false
      const data = JSON.stringify({
        testName: "API Test",
        testType: "API",
        testResult: "fail",
        executionTime: "2500",
        testData: "Test failed with error code 500",
      })

      // Add test data
      await testDataManager.addTestData(testName, testType, passed, data)

      // Get test data
      const testData = await testDataManager.getTestData(0)

      // Check test data fields
      expect(testData.testName).to.equal(testName)
      expect(testData.testType).to.equal(testType)
      expect(testData.passed).to.equal(passed)
      expect(testData.data).to.equal(data)
      expect(testData.submitter).to.equal(owner.address)
    })
  })

  describe("Retrieving test data", () => {
    beforeEach(async () => {
      // Add some test data
      await testDataManager.addTestData("Test 1", "UI", true, JSON.stringify({ data: "Test 1 data" }))

      await testDataManager.connect(addr1).addTestData("Test 2", "API", false, JSON.stringify({ data: "Test 2 data" }))
    })

    it("Should return the correct test data count", async () => {
      expect(await testDataManager.getTestDataCount()).to.equal(2)
    })

    it("Should return the correct test data by ID", async () => {
      const testData1 = await testDataManager.getTestData(0)
      expect(testData1.testName).to.equal("Test 1")
      expect(testData1.submitter).to.equal(owner.address)

      const testData2 = await testDataManager.getTestData(1)
      expect(testData2.testName).to.equal("Test 2")
      expect(testData2.submitter).to.equal(addr1.address)
    })

    it("Should revert when trying to get non-existent test data", async () => {
      await expect(testDataManager.getTestData(2)).to.be.revertedWith("Test data does not exist")
    })
  })
})
