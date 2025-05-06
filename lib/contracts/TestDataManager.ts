// Contract deployed address - replace this with your actual deployed address after deployment
export const TEST_DATA_MANAGER_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Import the ABI directly from the compiled contract artifacts
import contractArtifact from '../../../artifacts/contracts/TestDataManager.sol/TestDataManager.json';

// Use the ABI from the compiled contract
export const TestDataManagerABI = contractArtifact.abi;

// Helper function to get contract configuration
export const getTestDataManagerConfig = () => {
  return {
    address: TEST_DATA_MANAGER_ADDRESS,
    abi: TestDataManagerABI
  };
};
