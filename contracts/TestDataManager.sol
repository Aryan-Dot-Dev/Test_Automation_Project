// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TestDataManager {
    struct TestData {
        string testName;
        string testType;
        bool passed;
        uint256 timestamp;
        string data;
        address submitter;
    }

    TestData[] private testDataArray;
    address private owner;

    event TestDataAdded(
        uint256 indexed id,
        address indexed submitter,
        string testName,
        bool passed
    );

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    function addTestData(
        string memory _testName,
        string memory _testType,
        bool _passed,
        string memory _data
    ) public {
        uint256 id = testDataArray.length;
        
        TestData memory newTestData = TestData({
            testName: _testName,
            testType: _testType,
            passed: _passed,
            timestamp: block.timestamp,
            data: _data,
            submitter: msg.sender
        });
        
        testDataArray.push(newTestData);
        
        emit TestDataAdded(id, msg.sender, _testName, _passed);
    }

    function getTestData(uint256 _id) public view returns (
        string memory testName,
        string memory testType,
        bool passed,
        uint256 timestamp,
        string memory data,
        address submitter
    ) {
        require(_id < testDataArray.length, "Test data does not exist");
        
        TestData storage testData = testDataArray[_id];
        
        return (
            testData.testName,
            testData.testType,
            testData.passed,
            testData.timestamp,
            testData.data,
            testData.submitter
        );
    }

    function getTestDataCount() public view returns (uint256) {
        return testDataArray.length;
    }
}
