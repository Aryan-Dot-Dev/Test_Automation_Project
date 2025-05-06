# Blockchain Test Management System

A decentralized application for managing, tracking, and verifying software test data using blockchain technology.

## Overview

This project is a blockchain-based test management system that allows teams to store test results in an immutable and transparent way. By leveraging Ethereum blockchain technology, it ensures that test data cannot be tampered with and provides a verifiable audit trail of all testing activities.

## Features

- **Blockchain-Powered Test Data Storage**: Store test results securely on the Ethereum blockchain
- **Test Data Dashboard**: Visualize and analyze test results
- **Wallet Integration**: Connect using Web3 wallets like MetaMask
- **Real-Time Updates**: Get immediate updates when new test data is added
- **Audit Log**: View a complete history of all testing activities
- **Responsive Design**: Full support for desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js, React, Shadcn UI components
- **Smart Contracts**: Solidity
- **Blockchain Development**: Hardhat
- **Styling**: CSS
- **Authentication**: Ethereum wallet-based authentication
- **Testing**: Hardhat test environment, Chai

## Prerequisites

- Node.js (v14 or higher)
- npm or pnpm
- MetaMask or another Ethereum wallet
- Basic knowledge of blockchain concepts

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd blockchain-test-management
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Set up a local blockchain (for development):
   ```bash
   npx hardhat node
   ```

4. Deploy the smart contract to your local blockchain:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

5. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Smart Contract

The core of this application is the `TestDataManager.sol` smart contract, which handles:

- Adding new test data to the blockchain
- Retrieving test data by ID
- Counting total test entries
- Managing ownership and permissions

### Contract Structure

The contract manages test data with the following structure:

```solidity
struct TestData {
    string testName;
    string testType;
    bool passed;
    uint256 timestamp;
    string data;
    address submitter;
}
```

## Components

The application consists of several key components:

- **Connect Wallet**: Interface for connecting Ethereum wallets
- **Test Data Dashboard**: Overview of all test data and statistics
- **Test Data List**: Detailed list of all test entries
- **Test Data Form**: Form for submitting new test data
- **Test Data Details**: Detailed view of individual test entries
- **Audit Log**: Chronological log of all testing activities
- **Log Viewer**: Detailed view of system logs

## Usage

### Connecting Your Wallet

1. Click on the "Connect Wallet" button in the top right corner
2. Select your preferred wallet provider (e.g., MetaMask)
3. Approve the connection request in your wallet

### Submitting Test Data

1. Navigate to the "Submit Test" page
2. Fill out the test details form
3. Click "Submit" to record the test data on the blockchain
4. Confirm the transaction in your wallet

### Viewing Test Results

1. Go to the "Dashboard" to see an overview of all test data
2. Use the "Test List" to see individual test entries
3. Click on any test entry to view its details

## Development

### Local Development

```bash
npm run dev
# or
pnpm dev
```

### Building for Production

```bash
npm run build
# or
pnpm build
```

### Deploying to Test Networks

1. Update the `hardhat.config.js` file with your preferred network configuration
2. Deploy the contract:
   ```bash
   npx hardhat run scripts/deploy.js --network <network-name>
   ```

## Testing

Run tests for the smart contract:

```bash
npx hardhat test
```

## Project Structure

```
blockchain-test-management/
├── app/               # Next.js app directory
├── artifacts/         # Compiled contract artifacts
├── cache/             # Hardhat cache
├── components/        # React components
├── contracts/         # Solidity smart contracts
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and contract interfaces
├── public/            # Static assets
├── scripts/           # Deployment and setup scripts
├── styles/            # Global styles
├── test/              # Contract tests
├── types/             # TypeScript type definitions
├── hardhat.config.js  # Hardhat configuration
└── next.config.mjs    # Next.js configuration
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Hardhat for the blockchain development environment
- Next.js for the frontend framework
- Shadcn UI for the component library
- OpenZeppelin for smart contract security practices